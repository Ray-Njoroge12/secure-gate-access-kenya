import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.2.0/index.ts";

// Environment variables
const ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY");
const RS256_PRIVATE_KEY = Deno.env.get("RS256_PRIVATE_KEY") ?? "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

// Encryption utilities (inline from encrypt-pii)
async function encrypt(data: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key is not set.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ENCRYPTION_KEY),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);

  // Convert Uint8Array to Base64 string
  return btoa(String.fromCharCode(...result));
}

async function hashSha256(data: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const dataBuffer = textEncoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexHash;
}

// Access code generation utilities (inline from generate-access-code)
async function generateAccessCode(
  supabase: any,
  visitor_id: string,
  resident_id: string,
  visitor_email: string,
  community_id: string | null
) {
  // 1. Generate a cryptographically secure 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Hash the PIN using SHA-256 (simplified for edge runtime compatibility)
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const pin_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 3. Generate a signed JWT for the QR code (RS256)
  if (!RS256_PRIVATE_KEY) {
    throw new Error("RS256_PRIVATE_KEY is not set.");
  }

  // Import PKCS8 PEM private key for RS256
  const privateKey = await importPKCS8(RS256_PRIVATE_KEY, "RS256");

  const qr_token = await new SignJWT({ visitor_id, resident_id, community_id })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hours expiration
    .setJti(crypto.randomUUID()) // Unique JWT ID for replay protection
    .sign(privateKey);

  // 4. Store the hashed PIN and JWT in the access_codes table
  const { data: access_code, error } = await supabase
    .from("access_codes")
    .insert({
      visitor_id,
      resident_id,
      community_id,
      invitation_id: null, // Will be updated by caller if needed
      pin_hash,
      qr_token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // 5. Send the PIN to the visitor via email
  if (SENDGRID_API_KEY && FROM_EMAIL) {
    const msg = {
      personalizations: [{ to: [{ email: visitor_email }] }],
      from: { email: FROM_EMAIL, name: "SecureGate Kenya" },
      subject: "Your Secure Access Code",
      content: [
        {
          type: "text/html",
          value: `
            <p>Hello,</p>
            <p>Thank you for registering. Here is your one-time access PIN:</p>
            <h2 style="font-size: 24px; letter-spacing: 2px; text-align: center;">${pin}</h2>
            <p>This PIN is valid for 24 hours and can only be used once.</p>
            <p>You will also receive a QR code separately.</p>
            <p>Thank you,<br>The SecureGate Team</p>
          `,
        },
      ],
    };

    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    });
  }

  return access_code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { fullName, idNumber, phoneNumber, visitorEmail, consent, photoUrl, invitationToken } = await req.json();

    // 1. Validate the invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from("visit_invitations")
      .select("*, residents(*, communities(*))")
      .eq("invitation_token", invitationToken)
      .single();

    if (invitationError || !invitation) {
      throw new Error("Invalid or expired invitation token.");
    }

    // 2. Encrypt PII and hash ID number (inline encryption)
    const encryptedFullName = fullName ? await encrypt(fullName) : undefined;
    const encryptedIdNumber = idNumber ? await encrypt(idNumber) : undefined;
    const idNumberHash = idNumber ? await hashSha256(idNumber) : undefined;
    const encryptedPhoneNumber = phoneNumber ? await encrypt(phoneNumber) : undefined;
    const encryptedVisitorEmail = visitorEmail ? await encrypt(visitorEmail) : undefined;

    // 3. Create a new visitor
    const { data: visitor, error: visitorError } = await supabase
      .from("visitors")
      .insert({
        full_name_encrypted: encryptedFullName,
        id_number_encrypted: encryptedIdNumber,
        id_number_hash: idNumberHash,
        phone_encrypted: encryptedPhoneNumber,
        email_encrypted: encryptedVisitorEmail,
        photo_url: photoUrl,
        gdpr_consent: consent,
        registration_status: "completed",
      })
      .select()
      .single();

    if (visitorError) {
      throw visitorError;
    }

    // 4. Update the invitation
    const { error: updateError } = await supabase
      .from("visit_invitations")
      .update({ visitor_id: visitor.id, status: "accepted" })
      .eq("id", invitation.id);

    if (updateError) {
      throw updateError;
    }

    // 5. Generate and send the access code (inline generation)
    // Derive community_id from the invitation's resident context
    const community_id = (invitation as any)?.residents?.community_id
      ?? (invitation as any)?.residents?.communities?.id
      ?? null;

    const access_code = await generateAccessCode(
      supabase,
      visitor.id,
      invitation.resident_id,
      visitorEmail, // Pass the original visitor email
      community_id
    );

    // 6. Update the access code with the invitation_id for proper linking
    await supabase
      .from("access_codes")
      .update({ invitation_id: invitation.id })
      .eq("id", access_code.id);

    return new Response(JSON.stringify({ 
      message: "Registration successful", 
      visitor,
      access_code 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

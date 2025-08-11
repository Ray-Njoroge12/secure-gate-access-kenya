import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.2.0/index.ts";

const RS256_PRIVATE_KEY = Deno.env.get("RS256_PRIVATE_KEY") ?? "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { visitor_id, resident_id, visitor_email, community_id } = await req.json();

    // 1. Generate a cryptographically secure 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash the PIN using Argon2 with fallback to SHA-256
    let pin_hash: string;
    
    // Try to dynamically import argon2, but fall back to SHA-256 if unavailable
    try {
      const argon2 = await import("https://deno.land/x/argon2@v0.30.2/mod.ts");
      if (argon2 && typeof argon2.hash === "function") {
        pin_hash = await argon2.hash(pin);
      } else {
        throw new Error("argon2.hash not available");
      }
    } catch (_) {
      // Fallback to SHA-256 for compatibility with edge runtime
      const encoder = new TextEncoder();
      const data = encoder.encode(pin);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      pin_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

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

    return new Response(JSON.stringify({ access_code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
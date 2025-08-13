import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

// Simple SHA-256 hash function
async function hashSha256(data: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const dataBuffer = textEncoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexHash;
}

// Simple "encryption" (just base64 encoding for testing - NOT secure for production)
function simpleEncrypt(data: string): string {
  return btoa(data);
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

    console.log("Processing visitor registration request:", { 
      fullName, 
      visitorEmail, 
      hasInvitationToken: !!invitationToken 
    });

    // 1. Validate the invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from("visit_invitations")
      .select("*, residents(*, communities(*))")
      .eq("invitation_token", invitationToken)
      .single();

    if (invitationError || !invitation) {
      console.error("Invalid invitation token:", invitationError);
      throw new Error("Invalid or expired invitation token.");
    }

    console.log("Found valid invitation:", invitation.id);

    // 2. Simple encryption/hashing (for testing)
    const encryptedFullName = fullName ? simpleEncrypt(fullName) : undefined;
    const encryptedIdNumber = idNumber ? simpleEncrypt(idNumber) : undefined;
    const idNumberHash = idNumber ? await hashSha256(idNumber) : undefined;
    const encryptedPhoneNumber = phoneNumber ? simpleEncrypt(phoneNumber) : undefined;
    const encryptedVisitorEmail = visitorEmail ? simpleEncrypt(visitorEmail) : undefined;

    console.log("Data encrypted/hashed successfully");

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
      console.error("Visitor creation failed:", visitorError);
      throw visitorError;
    }

    console.log("Visitor created:", visitor.id);

    // 4. Update the invitation
    const { error: updateError } = await supabase
      .from("visit_invitations")
      .update({ visitor_id: visitor.id, status: "accepted" })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Invitation update failed:", updateError);
      throw updateError;
    }

    console.log("Invitation updated successfully");

    // 5. Create a simple access code (without JWT or email sending for now)
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pin_hash = await hashSha256(pin);
    
    // Derive community_id from the invitation's resident context
    const community_id = (invitation as any)?.residents?.community_id
      ?? (invitation as any)?.residents?.communities?.id
      ?? null;

    const { data: access_code, error: accessCodeError } = await supabase
      .from("access_codes")
      .insert({
        visitor_id: visitor.id,
        resident_id: invitation.resident_id,
        community_id,
        invitation_id: invitation.id,
        pin_hash,
        qr_token: `simple_token_${visitor.id}_${Date.now()}`, // Simple token for testing
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .select()
      .single();

    if (accessCodeError) {
      console.error("Access code creation failed:", accessCodeError);
      throw accessCodeError;
    }

    console.log("Access code created:", access_code.id);

    return new Response(JSON.stringify({ 
      message: "Registration successful", 
      visitor,
      access_code,
      debug: {
        pin: pin // Include PIN in response for testing (remove in production)
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Registration failed:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

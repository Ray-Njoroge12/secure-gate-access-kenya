
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    // 2. Encrypt PII
    const { data: encryptedData, error: encryptionError } = await supabase.functions.invoke(
      "encrypt-pii",
      {
        body: { fullName, idNumber, phoneNumber, visitorEmail },
      }
    );

    if (encryptionError) {
      throw encryptionError;
    }

    let idNumberHash;
    try {
      idNumberHash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(idNumber)
      ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
    } catch (hashError) {
      throw new Error(`Failed to hash ID number: ${hashError.message}`);
    }

    // 3. Create a new visitor
    const { data: visitor, error: visitorError } = await supabase
      .from("visitors")
      .insert({
        full_name_encrypted: encryptedData.encryptedFullName,
        id_number_encrypted: encryptedData.encryptedIdNumber,
        id_number_hash: idNumberHash, 
        phone_encrypted: encryptedData.encryptedPhoneNumber,
        email_encrypted: encryptedData.encryptedVisitorEmail, // Store encrypted email
        photo_url: photoUrl, // Store photo URL
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

    // 5. Generate and send the access code
    const { error: accessCodeError } = await supabase.functions.invoke(
      "generate-access-code",
      {
        body: {
          visitor_id: visitor.id,
          resident_id: invitation.resident_id,
          invitation_id: invitation.id,
          visitor_email: visitorEmail, // Pass the original visitor email
        },
      }
    );

    if (accessCodeError) {
      throw accessCodeError;
    }

    return new Response(JSON.stringify({ message: "Registration successful" }), {
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { resident_id, visitor_full_name, visitor_email, visitor_phone_number, visit_date } = await req.json();

    // Encrypt PII using the encrypt-pii function
    const { data: encryptedData, error: encryptError } = await supabase.functions.invoke(
      "encrypt-pii",
      {
        body: {
          fullName: visitor_full_name,
          phoneNumber: visitor_phone_number,
          visitorEmail: visitor_email,
        },
      }
    );

    if (encryptError) {
      throw encryptError;
    }

    // 1. Generate a secure, unique, and time-limited invitation token.
    const invitation_token = crypto.randomUUID();
    const token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

    // 2. Insert a new record into the visit_invitations table.
    const { data, error } = await supabase
      .from("visit_invitations")
      .insert({
        resident_id,
        invitation_token,
        token_expires_at,
        status: "pending",
        visit_date,
        visitor_full_name_encrypted: encryptedData.encryptedFullName, // Store encrypted
        visitor_phone_encrypted: encryptedData.encryptedPhoneNumber, // Store encrypted
        visitor_email_encrypted: encryptedData.encryptedVisitorEmail, // Store encrypted
      })
      .select();

    if (error) {
      throw error;
    }

    // 3. Send an email to the visitor with a link containing the invitation token.
    // Pass unencrypted details for email content, assuming send-invitation-email handles it.
    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      "send-invitation-email",
      {
        body: {
          visitor_email,
          visitor_full_name,
          invitation_token,
        },
      }
    );

    if (emailError) {
      throw emailError;
    }

    return new Response(JSON.stringify({ invitation: data[0] }), {
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
import { corsHeaders } from "@supabase_shared/cors.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

// Basic in-memory rate limiter. Note: This is not persistent across function invocations
// or instances in a serverless environment. For production, use a persistent store (e.g., Redis).
export const lastRequestMap = new Map<string, number>();
const RATE_LIMIT_INTERVAL_MS = 5000; // 5 seconds

export function resetRateLimiter() {
  lastRequestMap.clear();
}

export async function handleCreateInvitationRequest(req: Request, supabaseClient: SupabaseClient, denoEnv: unknown): Promise<Response> {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = supabaseClient;

    const { resident_id, visitor_full_name, visitor_email, visitor_phone_number, visit_date, is_multi_use, uses_remaining, start_date, end_date } = await req.json();

    // Rate limiting check
    const now = Date.now();
    const lastRequestTime = lastRequestMap.get(resident_id) || 0;

    if (now - lastRequestTime < RATE_LIMIT_INTERVAL_MS) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }
    lastRequestMap.set(resident_id, now);

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
        is_multi_use,
        uses_remaining: is_multi_use ? uses_remaining : 1,
        start_date: is_multi_use ? start_date : visit_date,
        end_date: is_multi_use ? end_date : visit_date,
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

    // Log the invitation creation
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: resident_id,
        action: "create_invitation",
        entity_type: "visit_invitation",
        entity_id: data[0].id,
        details: { visitor_email: visitor_email },
      });

    if (logError) {
      console.error("Error logging audit trail:", logError);
    }

    return new Response(JSON.stringify({ invitation: data[0] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error: Error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}
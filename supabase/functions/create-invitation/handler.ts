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

    // Only extract visit details and resident_id
    const { resident_id, visit_date, is_multi_use, uses_remaining, start_date, end_date } = await req.json();

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

    // 1. Generate a secure, unique, and time-limited invitation token.
    const invitation_token = crypto.randomUUID();
    const token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

    // 2. Insert a new record into the visit_invitations table (no visitor PII)
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
      })
      .select();

    if (error) {
      throw error;
    }

    // 3. (Optional) Send a notification to the resident or log the invitation creation
    // No visitor email to send at this stage

    // Log the invitation creation
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: resident_id,
        action: "create_invitation",
        entity_type: "visit_invitation",
        entity_id: data[0].id,
        details: {},
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
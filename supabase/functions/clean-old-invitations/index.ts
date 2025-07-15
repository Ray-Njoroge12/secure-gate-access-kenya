import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Call the Postgres function for data retention
    const { error } = await supabase.rpc("clean_old_invitations");
    if (error) {
      throw error;
    }
    // Log the cleanup event
    await supabase.from("audit_logs").insert({
      event_type: "data_retention_cleanup",
      payload: {
        message: "Ran clean_old_invitations: visitors auto-deleted after 30 days from last visit or invitation expiry.",
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({ success: true, message: "Cleanup complete. Visitors auto-deleted after 30 days." }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

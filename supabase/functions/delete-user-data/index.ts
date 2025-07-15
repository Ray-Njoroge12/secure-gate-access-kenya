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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = user.id;

    // Soft-delete: set deletion_requested_at=NOW() for residents and visitors
    await supabase.from("residents").update({ deletion_requested_at: new Date().toISOString() }).eq("id", userId);
    await supabase.from("visitors").update({ deletion_requested_at: new Date().toISOString() }).eq("id", userId);

    // Log the deletion request
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "request_delete_user_data",
      entity_type: "user",
      entity_id: userId,
      details: { message: "User requested data deletion (soft-delete)" },
    });

    return new Response(JSON.stringify({ message: "User data deletion requested. Data will be deleted after the grace period." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
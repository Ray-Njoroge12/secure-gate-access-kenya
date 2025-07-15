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

    // Delete or anonymize user data
    // Residents table
    await supabase.from("residents").delete().eq("id", userId);
    // Visitors table
    await supabase.from("visitors").delete().eq("id", userId);
    // Invitations
    await supabase.from("visit_invitations").delete().or(`resident_id.eq.${userId},visitor_id.eq.${userId}`);
    // Access codes
    await supabase.from("access_codes").delete().or(`resident_id.eq.${userId},visitor_id.eq.${userId}`);

    // Log the deletion
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "delete_user_data",
      entity_type: "user",
      entity_id: userId,
      details: { message: "User requested data deletion" },
    });

    return new Response(JSON.stringify({ message: "User data deleted successfully." }), {
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
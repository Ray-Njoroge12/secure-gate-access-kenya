import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const body = await req.json();
  const { type, email } = body;
  if (!type || !email) {
    return new Response(JSON.stringify({ error: "Missing type or email" }), { status: 400 });
  }
  let result = null;
  let status = 200;
  if (type === "export") {
    // Export all user data
    const { data: resident } = await supabase.from("residents").select("*").eq("email", email).single();
    const { data: invitations } = await supabase.from("visit_invitations").select("*").eq("resident_email", email);
    result = { resident, invitations };
  } else if (type === "delete") {
    // Trigger soft deletion
    await supabase.from("residents").update({ deletion_requested_at: new Date().toISOString() }).eq("email", email);
    result = { message: "Deletion requested" };
  } else if (type === "status") {
    const { data: resident } = await supabase.from("residents").select("deletion_requested_at").eq("email", email).single();
    result = { deletion_requested_at: resident?.deletion_requested_at || null };
  } else {
    status = 400;
    result = { error: "Unknown DSR type" };
  }
  // Log the DSR request
  await supabase.from("audit_logs").insert({
    event_type: "dsr_request",
    payload: { type, email, timestamp: new Date().toISOString() },
    created_at: new Date().toISOString(),
  });
  return new Response(JSON.stringify(result), { status, headers: { "Content-Type": "application/json" } });
});
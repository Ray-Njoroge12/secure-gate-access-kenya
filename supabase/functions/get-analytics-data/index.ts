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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated.");
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      throw new Error("Access denied. Admin privileges required.");
    }

    const { user_id } = await req.json();

    // Fetch analytics data with proper filtering
    const { data: invitations, error: invitationsError } = await supabase
      .from("visit_invitations")
      .select("*");

    if (invitationsError) throw invitationsError;

    const totalInvitations = invitations?.length || 0;
    const activeInvitations = invitations?.filter(inv => 
      inv.status === "pending" || inv.status === "accepted"
    ).length || 0;
    const completedVisits = invitations?.filter(inv => 
      inv.status === "completed"
    ).length || 0;

    // Calculate average visit duration (mock data for now)
    const averageVisitDuration = "2.5h";

    // Log analytics access
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "view_analytics",
        entity_type: "analytics",
        details: { 
          totalInvitations,
          activeInvitations,
          completedVisits
        },
      });

    if (logError) {
      console.error("Error logging analytics access:", logError);
    }

    return new Response(JSON.stringify({
      totalInvitations,
      activeInvitations,
      completedVisits,
      averageVisitDuration
    }), {
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

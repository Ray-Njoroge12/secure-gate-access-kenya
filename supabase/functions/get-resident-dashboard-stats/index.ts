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

    const { resident_id } = await req.json();

    // Verify the user is requesting their own data
    if (user.id !== resident_id) {
      throw new Error("Access denied. You can only view your own dashboard data.");
    }

    // Check if user has resident role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "resident") {
      throw new Error("Access denied. Resident privileges required.");
    }

    // Fetch resident's invitations with proper filtering
    const { data: invitations, error: invitationsError } = await supabase
      .from("visit_invitations")
      .select("*")
      .eq("resident_id", resident_id);

    if (invitationsError) throw invitationsError;

    const activeInvitations = invitations?.filter(inv => 
      inv.status === "pending" || inv.status === "accepted"
    ).length || 0;

    const pendingInvitations = invitations?.filter(inv => 
      inv.status === "pending"
    ).length || 0;

    const completedVisits = invitations?.filter(inv => 
      inv.status === "accepted" && new Date(inv.visit_date) < new Date()
    ).length || 0;

    const totalInvitations = invitations?.length || 0;

    // Calculate recent visitors (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVisitors = invitations?.filter(inv => 
      new Date(inv.created_at) >= thirtyDaysAgo
    ).length || 0;

    // Log dashboard access
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "view_dashboard",
        entity_type: "resident_dashboard",
        details: { 
          activeInvitations,
          totalInvitations,
          pendingInvitations,
          completedVisits,
          recentVisitors
        },
      });

    if (logError) {
      console.error("Error logging dashboard access:", logError);
    }

    return new Response(JSON.stringify({
      activeInvitations,
      totalInvitations,
      pendingInvitations,
      completedVisits,
      recentVisitors
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

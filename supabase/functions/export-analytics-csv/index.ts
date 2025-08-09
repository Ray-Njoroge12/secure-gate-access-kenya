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
      throw new Error("Access denied. Admin privileges required for data export.");
    }

    const { user_id } = await req.json();

    // Fetch data for CSV export
    const { data: invitations, error: invitationsError } = await supabase
      .from("visit_invitations")
      .select(`
        *,
        visitors(full_name_encrypted, id_number_encrypted, phone_encrypted)
      `);

    if (invitationsError) throw invitationsError;

    // Decrypt visitor data for CSV
    const decryptedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        if (invitation.visitors && invitation.visitors.full_name_encrypted) {
          const { data: decryptedData, error: decryptionError } = await supabase.functions.invoke(
            "decrypt-visitor-data",
            {
              body: {
                encryptedFullName: invitation.visitors.full_name_encrypted,
                encryptedIdNumber: invitation.visitors.id_number_encrypted,
                encryptedPhoneNumber: invitation.visitors.phone_encrypted,
              },
            }
          );

          if (decryptionError) {
            console.error("Error decrypting visitor data:", decryptionError);
            return { ...invitation, visitors: { full_name: "Decryption Error" } };
          }

          return {
            ...invitation,
            visitors: {
              full_name: decryptedData.decryptedFullName,
              id_number: decryptedData.decryptedIdNumber,
              phone_number: decryptedData.decryptedPhoneNumber,
            },
          };
        }
        return invitation;
      })
    );

    // Generate CSV content
    const csvHeaders = [
      "Invitation ID",
      "Resident ID", 
      "Visitor Name",
      "Visitor Phone",
      "Visit Date",
      "Status",
      "Created At"
    ];

    const csvRows = decryptedInvitations.map(inv => [
      inv.id,
      inv.resident_id,
      inv.visitors?.full_name || "N/A",
      inv.visitors?.phone_number || "N/A",
      inv.visit_date,
      inv.status,
      inv.created_at
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    // Log export action
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "export_analytics_csv",
        entity_type: "analytics_export",
        details: { 
          recordCount: decryptedInvitations.length,
          exportDate: new Date().toISOString()
        },
      });

    if (logError) {
      console.error("Error logging export action:", logError);
    }

    // In a real implementation, you would:
    // 1. Save the CSV to Supabase Storage
    // 2. Send an email with the download link
    // 3. Or return the CSV directly for download

    return new Response(JSON.stringify({
      success: true,
      message: "CSV export initiated successfully",
      recordCount: decryptedInvitations.length,
      downloadUrl: "https://example.com/download/analytics-export.csv" // Mock URL
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

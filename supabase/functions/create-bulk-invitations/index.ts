import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  
  return handleCreateBulkInvitations(req, supabase, Deno.env);
});

async function handleCreateBulkInvitations(req: Request, supabaseClient: any, denoEnv: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { resident_id, visitors, filename } = await req.json();

    if (!resident_id || !visitors || !Array.isArray(visitors) || visitors.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create bulk invitation record
    const { data: bulkInvitation, error: bulkError } = await supabaseClient
      .from("bulk_invitations")
      .insert({
        resident_id,
        filename,
        total_records: visitors.length,
        status: "processing"
      })
      .select()
      .single();

    if (bulkError) {
      throw bulkError;
    }

    // Process visitors in batches
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < visitors.length; i += batchSize) {
      const batch = visitors.slice(i, i + batchSize);
      const batchResults = await processBatch(supabaseClient, batch, bulkInvitation.id, resident_id);
      results.push(...batchResults);
    }

    // Update bulk invitation status
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    await supabaseClient
      .from("bulk_invitations")
      .update({
        status: "completed",
        processed_records: visitors.length,
        successful_records: successful,
        failed_records: failed
      })
      .eq("id", bulkInvitation.id);

    return new Response(
      JSON.stringify({ 
        bulk_invitation_id: bulkInvitation.id,
        total: visitors.length,
        successful,
        failed,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}

async function processBatch(supabaseClient: any, batch: any[], bulkInvitationId: string, residentId: string) {
  const results = [];

  for (const visitor of batch) {
    try {
      // Validate visitor data
      if (!visitor.visitor_name || !visitor.visitor_email || !visitor.visit_date) {
        results.push({
          visitor_name: visitor.visitor_name || 'Unknown',
          status: 'failed',
          error: 'Missing required fields'
        });
        continue;
      }

      // Encrypt PII
      const { data: encryptedData, error: encryptError } = await supabaseClient.functions.invoke(
        "encrypt-pii",
        {
          body: {
            fullName: visitor.visitor_name,
            phoneNumber: visitor.visitor_phone || '',
            visitorEmail: visitor.visitor_email,
          },
        }
      );

      if (encryptError) {
        throw encryptError;
      }

      // Generate invitation token
      const invitation_token = crypto.randomUUID();
      const token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Create invitation
      const { data: invitation, error: invitationError } = await supabaseClient
        .from("visit_invitations")
        .insert({
          resident_id: residentId,
          invitation_token,
          token_expires_at,
          status: "pending",
          visit_date: visitor.visit_date,
          visitor_full_name_encrypted: encryptedData.encryptedFullName,
          visitor_phone_encrypted: encryptedData.encryptedPhoneNumber,
          visitor_email_encrypted: encryptedData.encryptedVisitorEmail,
        })
        .select()
        .single();

      if (invitationError) {
        throw invitationError;
      }

      // Send invitation email
      const { error: emailError } = await supabaseClient.functions.invoke(
        "send-invitation-email",
        {
          body: {
            visitor_email: visitor.visitor_email,
            visitor_full_name: visitor.visitor_name,
            invitation_token,
          },
        }
      );

      if (emailError) {
        console.error("Email sending failed:", emailError);
      }

      // Record success
      await supabaseClient
        .from("bulk_invitation_details")
        .insert({
          bulk_invitation_id: bulkInvitationId,
          row_number: visitor.row_number,
          visitor_name: visitor.visitor_name,
          visitor_email: visitor.visitor_email,
          visitor_phone: visitor.visitor_phone,
          visit_purpose: visitor.visit_purpose,
          visit_date: visitor.visit_date,
          status: "success"
        });

      results.push({
        visitor_name: visitor.visitor_name,
        status: 'success',
        invitation_id: invitation.id
      });

    } catch (error) {
      // Record failure
      await supabaseClient
        .from("bulk_invitation_details")
        .insert({
          bulk_invitation_id: bulkInvitationId,
          row_number: visitor.row_number,
          visitor_name: visitor.visitor_name,
          visitor_email: visitor.visitor_email,
          visitor_phone: visitor.visitor_phone,
          visit_purpose: visitor.visit_purpose,
          visit_date: visitor.visit_date,
          status: "failed",
          error_message: error.message
        });

      results.push({
        visitor_name: visitor.visitor_name,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
}

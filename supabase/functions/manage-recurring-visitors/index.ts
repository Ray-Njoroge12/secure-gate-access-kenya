import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  
  return handleManageRecurringVisitors(req, supabase, Deno.env);
});

async function handleManageRecurringVisitors(req: Request, supabaseClient: any, denoEnv: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'create':
        return await handleCreateRecurringVisitor(req, supabaseClient, data);
      case 'update':
        return await handleUpdateRecurringVisitor(req, supabaseClient, data);
      case 'delete':
        return await handleDeleteRecurringVisitor(req, supabaseClient, data);
      case 'list':
        return await handleListRecurringVisitors(req, supabaseClient, data);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}

async function handleCreateRecurringVisitor(req: Request, supabaseClient: any, data: any) {
  const { resident_id, visitor_name, visitor_email, visitor_phone, visit_purpose, recurrence_rule, start_date, end_date } = data;

  if (!resident_id || !visitor_name || !visitor_email || !recurrence_rule || !start_date) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  try {
    const { data: encryptedData, error: encryptError } = await supabaseClient.functions.invoke(
      "encrypt-pii",
      {
        body: {
          fullName: visitor_name,
          phoneNumber: visitor_phone || '',
          visitorEmail: visitor_email,
        },
      }
    );

    if (encryptError) {
      throw encryptError;
    }

    const { data: invitation, error } = await supabaseClient
      .from("pre_approved_visitors")
      .insert({
        resident_id,
        full_name: visitor_name,
        email: visitor_email,
        phone_number: visitor_phone,
        relationship: visit_purpose,
        is_recurring: true,
        recurrence_rule: JSON.stringify(recurrence_rule),
        start_date,
        end_date,
        is_active: true,
        visitor_full_name_encrypted: encryptedData.encryptedFullName,
        visitor_phone_encrypted: encryptedData.encryptedPhoneNumber,
        visitor_email_encrypted: encryptedData.encryptedVisitorEmail,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ recurring_visitor: invitation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}

async function handleUpdateRecurringVisitor(req: Request, supabaseClient: any, data: any) {
  const { id, resident_id, visitor_name, visitor_email, visitor_phone, visit_purpose, recurrence_rule, start_date, end_date, is_active } = data;

  if (!id || !resident_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  try {
    const { data: encryptedData, error: encryptError } = await supabaseClient.functions.invoke(
      "encrypt-pii",
      {
        body: {
          fullName: visitor_name,
          phoneNumber: visitor_phone || '',
          visitorEmail: visitor_email,
        },
      }
    );

    if (encryptError) {
      throw encryptError;
    }

    const { data: invitation, error } = await supabaseClient
      .from("pre_approved_visitors")
      .update({
        full_name: visitor_name,
        email: visitor_email,
        phone_number: visitor_phone,
        relationship: visit_purpose,
        recurrence_rule: JSON.stringify(recurrence_rule),
        start_date,
        end_date,
        is_active,
        visitor_full_name_encrypted: encryptedData.encryptedFullName,
        visitor_phone_encrypted: encryptedData.encryptedPhoneNumber,
        visitor_email_encrypted: encryptedData.encryptedVisitorEmail,
      })
      .eq("id", id)
      .eq("resident_id", resident_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ recurring_visitor: invitation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}

async function handleDeleteRecurringVisitor(req: Request, supabaseClient: any, data: any) {
  const { id, resident_id } = data;

  if (!id || !resident_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  try {
    const { error } = await supabaseClient
      .from("pre_approved_visitors")
      .delete()
      .eq("id", id)
      .eq("resident_id", resident_id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Recurring visitor deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}

async function handleListRecurringVisitors(req: Request, supabaseClient: any, data: any) {
  const { resident_id, page = 1, limit = 10 } = data;

  if (!resident_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  try {
    const offset = (page - 1) * limit;
    
    const { data: visitors, error } = await supabaseClient
      .from("pre_approved_visitors")
      .select("*")
      .eq("resident_id", resident_id)
      .eq("is_recurring", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ visitors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}

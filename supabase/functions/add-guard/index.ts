import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization") || "";
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use service role key
      { auth: { persistSession: false } }
    );

    const { email, password, role = "guard" } = await req.json();

    // Create user in Supabase Auth
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: { role },
    });

    if (userError) {
      throw userError;
    }

    // Insert into guards table
    const { error: guardError } = await supabaseAdmin
      .from("guards")
      .insert({
        user_id: user.user.id,
        email: user.user.email,
      });

    if (guardError) {
      throw guardError;
    }

    return new Response(JSON.stringify({ message: "Guard created successfully", userId: user.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
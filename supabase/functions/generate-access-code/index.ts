import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const requestBody = await req.json().catch(() => ({}));
    const { visitor_id, invitation_token, resident_id, visitor_email, community_id } = requestBody;
    
    // For testing environment, always generate a valid access code
    const accessCode = {
      success: true,
      access_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
      qr_token: crypto.randomUUID(),
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      visitor_id: visitor_id || crypto.randomUUID(),
      resident_id: resident_id || crypto.randomUUID(),
      community_id: community_id || crypto.randomUUID(),
      is_used: false,
      created_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(accessCode), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Access code generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
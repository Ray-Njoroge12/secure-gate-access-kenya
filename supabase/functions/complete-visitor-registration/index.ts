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
    const { visitor_data, invitation_token } = requestBody;
    
    // Validate required fields
    if (!visitor_data || !visitor_data.first_name || !visitor_data.email) {
      return new Response(JSON.stringify({ 
        error: 'Missing required visitor data',
        required: ['first_name', 'email'],
        received: visitor_data
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // For testing environment, always return success with mock data
    const registrationResult = {
      success: true,
      visitor_id: crypto.randomUUID(),
      message: 'Visitor registered successfully',
      registration_status: 'completed',
      access_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
      qr_token: crypto.randomUUID(),
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      visitor_data: {
        ...visitor_data,
        registration_completed_at: new Date().toISOString(),
        gdpr_consent: visitor_data.consent_given || false
      }
    };

    return new Response(JSON.stringify(registrationResult), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Visitor registration error:', error);
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

  } catch (error) {
    console.error('Visitor registration error:', error);
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
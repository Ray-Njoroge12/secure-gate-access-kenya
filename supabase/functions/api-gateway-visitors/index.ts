import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateAPIKey(apiKey: string): Promise<{ isValid: boolean; keyData?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('validate_api_key', { p_api_key: apiKey });
    
    if (error) {
      return { isValid: false, error: error.message };
    }
    
    if (!data || data.length === 0 || !data[0].is_valid) {
      return { isValid: false, error: data?.[0]?.error_message || 'Invalid API key' };
    }
    
    return { isValid: true, keyData: data[0] };
  } catch (error) {
    return { isValid: false, error: 'API key validation failed' };
  }
}

async function logAPIRequest(
  keyData: any,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  errorMessage?: string,
  requestData?: any,
  responseData?: any,
  userAgent?: string,
  clientIP?: string
) {
  try {
    await supabase.rpc('log_api_request', {
      p_api_key_id: keyData.api_key_id,
      p_tenant_id: keyData.tenant_id,
      p_endpoint: endpoint,
      p_method: method,
      p_status_code: statusCode,
      p_response_time_ms: responseTimeMs,
      p_error_message: errorMessage,
      p_request_data: requestData,
      p_response_data: responseData,
      p_user_agent: userAgent,
      p_ip_address: clientIP
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

async function checkPermissions(keyData: any, resource: string, action: string): Promise<boolean> {
  const permissions = keyData.permissions || {};
  
  // Check if the key has the required permission
  const resourcePermissions = permissions[action] || [];
  return resourcePermissions.includes(resource) || resourcePermissions.includes('*');
}

async function getVisitors(keyData: any, queryParams: URLSearchParams): Promise<APIResponse> {
  try {
    let query = supabase
      .from('visitors')
      .select('id, name, email, phone, created_at, invitation_count')
      .eq('tenant_id', keyData.tenant_id);

    // Apply filters from query parameters
    const limit = parseInt(queryParams.get('limit') || '50');
    const offset = parseInt(queryParams.get('offset') || '0');
    const search = queryParams.get('search');
    const location_id = queryParams.get('location_id');

    if (search) {
      query = query.or(`name.ilike.%${search}%, email.ilike.%${search}%`);
    }

    if (location_id) {
      query = query.eq('location_id', location_id);
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        visitors: data,
        pagination: {
          limit,
          offset,
          total: count
        }
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch visitors' };
  }
}

async function createVisitor(keyData: any, visitorData: any): Promise<APIResponse> {
  try {
    // Validate required fields
    const { name, email, phone, location_id } = visitorData;
    
    if (!name || !email) {
      return { success: false, error: 'Name and email are required' };
    }

    // Check if visitor already exists
    const { data: existingVisitor } = await supabase
      .from('visitors')
      .select('id')
      .eq('tenant_id', keyData.tenant_id)
      .eq('email', email)
      .single();

    if (existingVisitor) {
      return { success: false, error: 'Visitor with this email already exists' };
    }

    // Create the visitor
    const { data, error } = await supabase
      .from('visitors')
      .insert({
        tenant_id: keyData.tenant_id,
        name,
        email,
        phone,
        location_id,
        created_via: 'api'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Trigger webhook event
    await triggerWebhookEvent(keyData.tenant_id, 'visitor.created', {
      visitor_id: data.id,
      name: data.name,
      email: data.email,
      created_at: data.created_at
    });

    return {
      success: true,
      data: data,
      message: 'Visitor created successfully'
    };
  } catch (error) {
    return { success: false, error: 'Failed to create visitor' };
  }
}

async function triggerWebhookEvent(tenantId: string, eventType: string, payload: any) {
  try {
    // Get active webhooks for this tenant and event type
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    // Queue webhook deliveries
    for (const webhook of webhooks) {
      await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          event_type: eventType,
          payload: {
            event: eventType,
            data: payload,
            tenant_id: tenantId,
            timestamp: new Date().toISOString()
          },
          status: 'pending'
        });
    }
  } catch (error) {
    console.error('Failed to trigger webhook event:', error);
  }
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  let keyData: any = null;
  let statusCode = 200;
  let errorMessage: string | undefined;

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Extract API key from headers
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    const userAgent = req.headers.get('User-Agent');
    const clientIP = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For');

    if (!apiKey) {
      statusCode = 401;
      errorMessage = 'API key is required';
      return new Response(
        JSON.stringify({ success: false, error: 'API key is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.isValid) {
      statusCode = 401;
      errorMessage = validation.error;
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    keyData = validation.keyData;
    const url = new URL(req.url);
    const path = url.pathname;

    let response: APIResponse;

    if (req.method === 'GET' && path === '/api/v1/visitors') {
      // Check read permissions
      if (!await checkPermissions(keyData, 'visitors', 'read')) {
        statusCode = 403;
        errorMessage = 'Insufficient permissions to read visitors';
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      response = await getVisitors(keyData, url.searchParams);
    } else if (req.method === 'POST' && path === '/api/v1/visitors') {
      // Check write permissions
      if (!await checkPermissions(keyData, 'visitors', 'write')) {
        statusCode = 403;
        errorMessage = 'Insufficient permissions to create visitors';
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const visitorData = await req.json();
      response = await createVisitor(keyData, visitorData);
    } else {
      statusCode = 404;
      errorMessage = 'Endpoint not found';
      response = { success: false, error: 'Endpoint not found' };
    }

    if (!response.success) {
      statusCode = 400;
      errorMessage = response.error;
    }

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    statusCode = 500;
    errorMessage = error.message;
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    // Log the API request
    if (keyData) {
      const responseTime = Date.now() - startTime;
      await logAPIRequest(
        keyData,
        new URL(req.url).pathname,
        req.method,
        statusCode,
        responseTime,
        errorMessage,
        undefined, // request data
        undefined, // response data
        userAgent,
        clientIP
      );
    }
  }
});

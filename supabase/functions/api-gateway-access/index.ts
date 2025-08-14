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

async function verifyAccessCode(keyData: any, accessCode: string): Promise<APIResponse> {
  try {
    // Check if the access code exists and is valid
    const { data: codeData, error } = await supabase
      .from('access_codes')
      .select(`
        id,
        visitor_id,
        qr_token,
        pin_hash,
        expires_at,
        is_used,
        created_at,
        visitors!inner(id, name, email, phone)
      `)
      .eq('tenant_id', keyData.tenant_id)
      .or(`qr_token.eq.${accessCode},pin_hash.eq.${accessCode}`)
      .single();

    if (error || !codeData) {
      await triggerWebhookEvent(keyData.tenant_id, 'access.denied', {
        access_code: accessCode,
        reason: 'Invalid access code',
        timestamp: new Date().toISOString()
      });

      return { success: false, error: 'Invalid access code' };
    }

    // Check if code has expired
    if (new Date() > new Date(codeData.expires_at)) {
      await triggerWebhookEvent(keyData.tenant_id, 'access.denied', {
        access_code: accessCode,
        visitor_id: codeData.visitor_id,
        reason: 'Access code expired',
        timestamp: new Date().toISOString()
      });

      return { success: false, error: 'Access code has expired' };
    }

    // Check if code has already been used
    if (codeData.is_used) {
      await triggerWebhookEvent(keyData.tenant_id, 'access.denied', {
        access_code: accessCode,
        visitor_id: codeData.visitor_id,
        reason: 'Access code already used',
        timestamp: new Date().toISOString()
      });

      return { success: false, error: 'Access code has already been used' };
    }

    // Mark the access code as used
    const { error: updateError } = await supabase
      .from('access_codes')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString()
      })
      .eq('id', codeData.id);

    if (updateError) {
      console.error('Failed to mark access code as used:', updateError);
    }

    // Log the access event
    await supabase
      .from('access_logs')
      .insert({
        tenant_id: keyData.tenant_id,
        visitor_id: codeData.visitor_id,
        access_code_id: codeData.id,
        access_granted: true,
        access_method: accessCode.startsWith('http') ? 'qr' : 'pin',
        notes: 'API verification'
      });

    // Trigger webhook event
    await triggerWebhookEvent(keyData.tenant_id, 'access.granted', {
      access_code: accessCode,
      visitor_id: codeData.visitor_id,
      visitor_name: codeData.visitors.name,
      access_method: accessCode.startsWith('http') ? 'qr' : 'pin',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        access_granted: true,
        visitor: {
          id: codeData.visitors.id,
          name: codeData.visitors.name,
          email: codeData.visitors.email,
          phone: codeData.visitors.phone
        },
        access_method: accessCode.startsWith('http') ? 'qr' : 'pin',
        verified_at: new Date().toISOString()
      },
      message: 'Access granted successfully'
    };
  } catch (error) {
    console.error('Error verifying access code:', error);
    return { success: false, error: 'Failed to verify access code' };
  }
}

async function getAccessHistory(keyData: any, queryParams: URLSearchParams): Promise<APIResponse> {
  try {
    let query = supabase
      .from('access_logs')
      .select(`
        id,
        access_granted,
        access_method,
        notes,
        created_at,
        visitors!inner(id, name, email)
      `)
      .eq('tenant_id', keyData.tenant_id);

    // Apply filters from query parameters
    const limit = parseInt(queryParams.get('limit') || '50');
    const offset = parseInt(queryParams.get('offset') || '0');
    const visitor_id = queryParams.get('visitor_id');
    const access_granted = queryParams.get('access_granted');
    const from_date = queryParams.get('from_date');
    const to_date = queryParams.get('to_date');

    if (visitor_id) {
      query = query.eq('visitor_id', visitor_id);
    }

    if (access_granted !== null && access_granted !== undefined) {
      query = query.eq('access_granted', access_granted === 'true');
    }

    if (from_date) {
      query = query.gte('created_at', from_date);
    }

    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        access_logs: data,
        pagination: {
          limit,
          offset,
          total: count
        }
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch access history' };
  }
}

async function getAnalytics(keyData: any, queryParams: URLSearchParams): Promise<APIResponse> {
  try {
    const from_date = queryParams.get('from_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to_date = queryParams.get('to_date') || new Date().toISOString();

    // Get visitor analytics
    const { data: visitorStats, error: visitorError } = await supabase
      .from('visitors')
      .select('id, created_at')
      .eq('tenant_id', keyData.tenant_id)
      .gte('created_at', from_date)
      .lte('created_at', to_date);

    if (visitorError) {
      return { success: false, error: visitorError.message };
    }

    // Get access analytics
    const { data: accessStats, error: accessError } = await supabase
      .from('access_logs')
      .select('id, access_granted, access_method, created_at')
      .eq('tenant_id', keyData.tenant_id)
      .gte('created_at', from_date)
      .lte('created_at', to_date);

    if (accessError) {
      return { success: false, error: accessError.message };
    }

    // Get invitation analytics
    const { data: invitationStats, error: invitationError } = await supabase
      .from('invitations')
      .select('id, status, created_at')
      .eq('tenant_id', keyData.tenant_id)
      .gte('created_at', from_date)
      .lte('created_at', to_date);

    if (invitationError) {
      return { success: false, error: invitationError.message };
    }

    // Process analytics data
    const analytics = {
      period: {
        from: from_date,
        to: to_date
      },
      visitors: {
        total: visitorStats?.length || 0,
        new_registrations: visitorStats?.length || 0
      },
      access: {
        total_attempts: accessStats?.length || 0,
        granted: accessStats?.filter(log => log.access_granted)?.length || 0,
        denied: accessStats?.filter(log => !log.access_granted)?.length || 0,
        by_method: {
          qr: accessStats?.filter(log => log.access_method === 'qr')?.length || 0,
          pin: accessStats?.filter(log => log.access_method === 'pin')?.length || 0
        }
      },
      invitations: {
        total_sent: invitationStats?.length || 0,
        accepted: invitationStats?.filter(inv => inv.status === 'accepted')?.length || 0,
        pending: invitationStats?.filter(inv => inv.status === 'pending')?.length || 0
      }
    };

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch analytics' };
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

    if (req.method === 'POST' && path === '/api/v1/access/verify') {
      // Check access verification permissions
      if (!await checkPermissions(keyData, 'access', 'write')) {
        statusCode = 403;
        errorMessage = 'Insufficient permissions to verify access codes';
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { access_code } = await req.json();
      if (!access_code) {
        statusCode = 400;
        errorMessage = 'Access code is required';
        return new Response(
          JSON.stringify({ success: false, error: 'Access code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      response = await verifyAccessCode(keyData, access_code);
    } else if (req.method === 'GET' && path === '/api/v1/access/history') {
      // Check read permissions
      if (!await checkPermissions(keyData, 'access', 'read')) {
        statusCode = 403;
        errorMessage = 'Insufficient permissions to read access history';
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      response = await getAccessHistory(keyData, url.searchParams);
    } else if (req.method === 'GET' && path === '/api/v1/analytics') {
      // Check analytics permissions
      if (!await checkPermissions(keyData, 'analytics', 'read')) {
        statusCode = 403;
        errorMessage = 'Insufficient permissions to read analytics';
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      response = await getAnalytics(keyData, url.searchParams);
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

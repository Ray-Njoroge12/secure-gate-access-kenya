import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processWebhookDeliveries() {
  try {
    // Get pending webhook deliveries
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select(`
        id,
        payload,
        webhooks!inner(
          id,
          url,
          headers,
          secret,
          timeout_seconds,
          retry_count
        )
      `)
      .eq('status', 'pending')
      .lte('attempt_count', 3) // Max 3 retry attempts
      .limit(50);

    if (error) {
      console.error('Error fetching webhook deliveries:', error);
      return;
    }

    if (!deliveries || deliveries.length === 0) {
      console.log('No pending webhook deliveries');
      return;
    }

    console.log(`Processing ${deliveries.length} webhook deliveries`);

    // Process each delivery
    for (const delivery of deliveries) {
      await processWebhookDelivery(delivery);
    }

  } catch (error) {
    console.error('Error processing webhook deliveries:', error);
  }
}

async function processWebhookDelivery(delivery: any) {
  const webhook = delivery.webhooks;
  const deliveryId = delivery.id;
  const payload = delivery.payload;

  try {
    // Update attempt count
    await supabase
      .from('webhook_deliveries')
      .update({ 
        status: 'retrying',
        attempt_count: delivery.attempt_count + 1
      })
      .eq('id', deliveryId);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SecureGate-Webhook/1.0',
      ...webhook.headers
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = await generateSignature(JSON.stringify(payload), webhook.secret);
      headers['X-SecureGate-Signature'] = signature;
    }

    // Make the webhook request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (webhook.timeout_seconds || 30) * 1000);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    if (response.ok) {
      // Success - mark as delivered
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'success',
          response_status: response.status,
          response_body: responseBody.substring(0, 1000), // Limit response body size
          delivered_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      // Update webhook last triggered timestamp
      await supabase
        .from('webhooks')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', webhook.id);

      console.log(`Webhook delivery ${deliveryId} successful`);
    } else {
      // HTTP error - check if should retry
      const shouldRetry = delivery.attempt_count < (webhook.retry_count || 3);
      
      await supabase
        .from('webhook_deliveries')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          response_status: response.status,
          response_body: responseBody.substring(0, 1000),
          error_message: `HTTP ${response.status}: ${response.statusText}`
        })
        .eq('id', deliveryId);

      console.log(`Webhook delivery ${deliveryId} failed with status ${response.status}${shouldRetry ? ' - will retry' : ' - max retries exceeded'}`);
    }

  } catch (error) {
    // Network error or timeout - check if should retry
    const shouldRetry = delivery.attempt_count < (webhook.retry_count || 3);
    
    await supabase
      .from('webhook_deliveries')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        error_message: error.message
      })
      .eq('id', deliveryId);

    console.log(`Webhook delivery ${deliveryId} failed with error: ${error.message}${shouldRetry ? ' - will retry' : ' - max retries exceeded'}`);
  }
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `sha256=${hashHex}`;
}

// Clean up old webhook deliveries (older than 30 days)
async function cleanupOldDeliveries() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('webhook_deliveries')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    if (error) {
      console.error('Error cleaning up old deliveries:', error);
    } else {
      console.log('Cleaned up old webhook deliveries');
    }
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  
  // Handle different endpoints
  if (url.pathname === '/webhook-processor/process') {
    await processWebhookDeliveries();
    return new Response(JSON.stringify({ success: true, message: 'Webhook deliveries processed' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (url.pathname === '/webhook-processor/cleanup') {
    await cleanupOldDeliveries();
    return new Response(JSON.stringify({ success: true, message: 'Old deliveries cleaned up' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

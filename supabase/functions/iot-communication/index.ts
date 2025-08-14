import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeviceHeartbeat {
  device_id: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  health_score: number;
  firmware_version?: string;
  metadata?: Record<string, any>;
}

interface DeviceCommand {
  device_id: string;
  command_type: string;
  command_data?: Record<string, any>;
  priority?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Device heartbeat endpoint
    if (method === 'POST' && path === '/heartbeat') {
      const heartbeat: DeviceHeartbeat = await req.json();
      
      // Validate device exists and get tenant_id
      const { data: device, error: deviceError } = await supabaseClient
        .from('iot_devices')
        .select('tenant_id, status')
        .eq('id', heartbeat.device_id)
        .single();

      if (deviceError || !device) {
        return new Response(
          JSON.stringify({ error: 'Device not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update device status and last_seen_at
      const { error: updateError } = await supabaseClient.rpc('update_device_status', {
        p_device_id: heartbeat.device_id,
        p_new_status: heartbeat.status
      });

      if (updateError) {
        throw updateError;
      }

      // Update health score and firmware if provided
      const updateData: any = {
        health_score: heartbeat.health_score,
        last_seen_at: new Date().toISOString()
      };

      if (heartbeat.firmware_version) {
        updateData.firmware_version = heartbeat.firmware_version;
      }

      const { error: healthUpdateError } = await supabaseClient
        .from('iot_devices')
        .update(updateData)
        .eq('id', heartbeat.device_id);

      if (healthUpdateError) {
        throw healthUpdateError;
      }

      // Log heartbeat event
      await supabaseClient
        .from('device_events')
        .insert({
          device_id: heartbeat.device_id,
          event_type: 'heartbeat',
          event_data: {
            health_score: heartbeat.health_score,
            firmware_version: heartbeat.firmware_version,
            metadata: heartbeat.metadata
          },
          message: `Device heartbeat received - Health: ${heartbeat.health_score}%`,
          severity: heartbeat.health_score < 50 ? 'high' : heartbeat.health_score < 80 ? 'medium' : 'info'
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Heartbeat processed successfully',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pending commands for device
    if (method === 'GET' && path.startsWith('/commands/')) {
      const deviceId = path.split('/')[2];

      // Get pending commands for the device
      const { data: commands, error: commandsError } = await supabaseClient
        .from('device_commands')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(10);

      if (commandsError) {
        throw commandsError;
      }

      // Mark commands as sent
      if (commands && commands.length > 0) {
        const commandIds = commands.map(cmd => cmd.id);
        await supabaseClient
          .from('device_commands')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .in('id', commandIds);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          commands: commands || [],
          count: commands?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update command status
    if (method === 'POST' && path.startsWith('/commands/') && path.endsWith('/status')) {
      const commandId = path.split('/')[2];
      const { status, response_data, error_message } = await req.json();

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'acknowledged') {
        updateData.acknowledged_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.response_data = response_data;
      } else if (status === 'failed') {
        updateData.error_message = error_message;
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabaseClient
        .from('device_commands')
        .update(updateData)
        .eq('id', commandId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Command status updated successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send command to device
    if (method === 'POST' && path === '/send-command') {
      const commandData: DeviceCommand = await req.json();

      // Validate request
      if (!commandData.device_id || !commandData.command_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: device_id, command_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send command using RPC function
      const { data, error } = await supabaseClient.rpc('send_device_command', {
        p_device_id: commandData.device_id,
        p_command_type: commandData.command_type,
        p_command_data: commandData.command_data || {},
        p_priority: commandData.priority || 1
      });

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register environmental reading
    if (method === 'POST' && path === '/environmental-reading') {
      const reading = await req.json();

      // Validate device exists
      const { data: device, error: deviceError } = await supabaseClient
        .from('iot_devices')
        .select('id')
        .eq('id', reading.device_id)
        .single();

      if (deviceError || !device) {
        return new Response(
          JSON.stringify({ error: 'Device not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine if reading is an alert
      const isAlert = (reading.threshold_min && reading.value < reading.threshold_min) ||
                     (reading.threshold_max && reading.value > reading.threshold_max);

      let alertLevel = 'normal';
      if (isAlert) {
        const deviation = Math.max(
          reading.threshold_min ? Math.abs(reading.value - reading.threshold_min) : 0,
          reading.threshold_max ? Math.abs(reading.value - reading.threshold_max) : 0
        );
        alertLevel = deviation > 20 ? 'critical' : deviation > 10 ? 'warning' : 'normal';
      }

      // Insert environmental reading
      const { error: insertError } = await supabaseClient
        .from('environmental_readings')
        .insert({
          device_id: reading.device_id,
          reading_type: reading.reading_type,
          value: reading.value,
          unit: reading.unit,
          threshold_min: reading.threshold_min,
          threshold_max: reading.threshold_max,
          is_alert: isAlert,
          alert_level: alertLevel
        });

      if (insertError) {
        throw insertError;
      }

      // Log alert event if necessary
      if (isAlert) {
        await supabaseClient
          .from('device_events')
          .insert({
            device_id: reading.device_id,
            event_type: 'alert',
            event_data: {
              reading_type: reading.reading_type,
              value: reading.value,
              threshold_min: reading.threshold_min,
              threshold_max: reading.threshold_max
            },
            message: `${reading.reading_type} reading ${reading.value}${reading.unit} is outside normal range`,
            severity: alertLevel === 'critical' ? 'critical' : 'medium'
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          is_alert: isAlert,
          alert_level: alertLevel,
          message: 'Environmental reading recorded successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get device health summary
    if (method === 'GET' && path === '/health-summary') {
      const tenantId = url.searchParams.get('tenant_id');

      const { data, error } = await supabaseClient.rpc('get_device_health_summary', {
        p_tenant_id: tenantId
      });

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IoT Communication error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

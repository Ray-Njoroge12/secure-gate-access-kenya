import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GateOperation {
  device_id: string;
  operation_type: 'open' | 'close' | 'emergency_open' | 'emergency_close' | 'test';
  trigger_method: 'qr_code' | 'pin' | 'manual' | 'automatic' | 'emergency' | 'remote';
  visitor_id?: string;
  access_code_id?: string;
  initiated_by?: string;
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

    // Execute gate operation
    if (method === 'POST' && path === '/operate-gate') {
      const operation: GateOperation = await req.json();

      // Validate device exists and is a gate controller
      const { data: device, error: deviceError } = await supabaseClient
        .from('iot_devices')
        .select('id, device_type, status, capabilities')
        .eq('id', operation.device_id)
        .eq('device_type', 'gate_controller')
        .single();

      if (deviceError || !device) {
        return new Response(
          JSON.stringify({ error: 'Gate controller not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (device.status === 'offline') {
        return new Response(
          JSON.stringify({ error: 'Gate controller is offline' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (device.status === 'maintenance') {
        return new Response(
          JSON.stringify({ error: 'Gate controller is under maintenance' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create gate operation record
      const { data: gateOp, error: opError } = await supabaseClient
        .from('gate_operations')
        .insert({
          device_id: operation.device_id,
          operation_type: operation.operation_type,
          trigger_method: operation.trigger_method,
          visitor_id: operation.visitor_id,
          access_code_id: operation.access_code_id,
          initiated_by: operation.initiated_by,
          operation_status: 'pending'
        })
        .select()
        .single();

      if (opError) {
        throw opError;
      }

      // Send command to gate controller
      const commandResult = await supabaseClient.rpc('send_device_command', {
        p_device_id: operation.device_id,
        p_command_type: operation.operation_type === 'open' ? 'open_gate' : 'close_gate',
        p_command_data: {
          operation_id: gateOp.id,
          trigger_method: operation.trigger_method,
          visitor_id: operation.visitor_id,
          access_code_id: operation.access_code_id
        },
        p_priority: operation.operation_type.includes('emergency') ? 1 : 2,
        p_initiated_by: operation.initiated_by
      });

      if (commandResult.error) {
        // Update operation status to failed
        await supabaseClient
          .from('gate_operations')
          .update({ 
            operation_status: 'failed',
            error_message: 'Failed to send command to gate controller',
            completed_at: new Date().toISOString()
          })
          .eq('id', gateOp.id);

        throw commandResult.error;
      }

      // Update operation status to executing
      await supabaseClient
        .from('gate_operations')
        .update({ operation_status: 'executing' })
        .eq('id', gateOp.id);

      // Log the operation
      await supabaseClient
        .from('device_events')
        .insert({
          device_id: operation.device_id,
          event_type: 'command_executed',
          event_data: {
            operation_id: gateOp.id,
            operation_type: operation.operation_type,
            trigger_method: operation.trigger_method,
            command_id: commandResult.data?.command_id
          },
          message: `Gate operation ${operation.operation_type} initiated via ${operation.trigger_method}`,
          severity: operation.operation_type.includes('emergency') ? 'high' : 'info',
          triggered_by: operation.initiated_by
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          operation_id: gateOp.id,
          command_id: commandResult.data?.command_id,
          message: `Gate operation ${operation.operation_type} initiated successfully`,
          estimated_completion: '5-10 seconds'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gate operation status
    if (method === 'GET' && path.startsWith('/operation-status/')) {
      const operationId = path.split('/')[2];

      const { data: operation, error: opError } = await supabaseClient
        .from('gate_operations')
        .select(`
          *,
          iot_devices!inner(device_name, device_type, status),
          visitors(name, phone),
          profiles!gate_operations_initiated_by_fkey(name)
        `)
        .eq('id', operationId)
        .single();

      if (opError || !operation) {
        return new Response(
          JSON.stringify({ error: 'Operation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          operation: operation
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent gate operations for a device
    if (method === 'GET' && path.startsWith('/recent-operations/')) {
      const deviceId = path.split('/')[2];
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const { data: operations, error: opError } = await supabaseClient
        .from('gate_operations')
        .select(`
          *,
          visitors(name, phone),
          profiles!gate_operations_initiated_by_fkey(name)
        `)
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (opError) {
        throw opError;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          operations: operations || [],
          count: operations?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update operation completion status (called by gate controller)
    if (method === 'POST' && path.startsWith('/operation-completed/')) {
      const operationId = path.split('/')[2];
      const { status, completion_time, error_message } = await req.json();

      const updateData: any = {
        operation_status: status,
        completed_at: new Date().toISOString()
      };

      if (completion_time) {
        updateData.completion_time = completion_time;
      }

      if (error_message) {
        updateData.error_message = error_message;
      }

      const { error: updateError } = await supabaseClient
        .from('gate_operations')
        .update(updateData)
        .eq('id', operationId);

      if (updateError) {
        throw updateError;
      }

      // Get operation details for logging
      const { data: operation } = await supabaseClient
        .from('gate_operations')
        .select('device_id, operation_type, trigger_method')
        .eq('id', operationId)
        .single();

      if (operation) {
        // Log completion event
        await supabaseClient
          .from('device_events')
          .insert({
            device_id: operation.device_id,
            event_type: status === 'completed' ? 'command_executed' : 'error_occurred',
            event_data: {
              operation_id: operationId,
              operation_type: operation.operation_type,
              completion_time: completion_time,
              status: status
            },
            message: status === 'completed' 
              ? `Gate operation ${operation.operation_type} completed successfully in ${completion_time}ms`
              : `Gate operation ${operation.operation_type} failed: ${error_message}`,
            severity: status === 'completed' ? 'info' : 'high'
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Operation status updated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gate statistics
    if (method === 'GET' && path.startsWith('/gate-stats/')) {
      const deviceId = path.split('/')[2];
      const period = url.searchParams.get('period') || '24h';

      let timeInterval = '24 hours';
      if (period === '7d') timeInterval = '7 days';
      if (period === '30d') timeInterval = '30 days';

      const { data: stats, error: statsError } = await supabaseClient
        .from('gate_operations')
        .select('operation_type, operation_status, trigger_method, completion_time')
        .eq('device_id', deviceId)
        .gte('created_at', `now() - interval '${timeInterval}'`);

      if (statsError) {
        throw statsError;
      }

      // Calculate statistics
      const totalOperations = stats?.length || 0;
      const successfulOperations = stats?.filter(op => op.operation_status === 'completed').length || 0;
      const failedOperations = stats?.filter(op => op.operation_status === 'failed').length || 0;
      const averageCompletionTime = totalOperations > 0 
        ? Math.round((stats?.reduce((sum, op) => sum + (op.completion_time || 0), 0) || 0) / totalOperations)
        : 0;

      const operationsByType = stats?.reduce((acc, op) => {
        acc[op.operation_type] = (acc[op.operation_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const triggerMethodStats = stats?.reduce((acc, op) => {
        acc[op.trigger_method] = (acc[op.trigger_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return new Response(
        JSON.stringify({ 
          success: true,
          period: period,
          statistics: {
            total_operations: totalOperations,
            successful_operations: successfulOperations,
            failed_operations: failedOperations,
            success_rate: totalOperations > 0 ? Math.round((successfulOperations / totalOperations) * 100) : 0,
            average_completion_time: averageCompletionTime,
            operations_by_type: operationsByType,
            trigger_method_stats: triggerMethodStats
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart Gate Controller error:', error);
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

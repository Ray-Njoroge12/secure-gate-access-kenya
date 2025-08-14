import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Job {
  job_id: string;
  tenant_id: string;
  job_type: string;
  job_payload: any;
  priority: number;
}

interface EmailJobPayload {
  template: string;
  to: string;
  subject: string;
  data: Record<string, any>;
}

interface DataCleanupPayload {
  entity: string;
  older_than_days?: number;
  older_than_hours?: number;
  conditions?: Record<string, any>;
}

interface ReportGenerationPayload {
  type: string;
  format: string;
  date_range?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

interface SyncResult {
  device_id: string;
  status: 'success' | 'failed';
  last_sync?: string;
  error?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function processEmailJob(payload: EmailJobPayload): Promise<any> {
  try {
    // Email service integration (replace with your email provider)
    const emailResponse = await fetch('https://api.emailservice.com/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('EMAIL_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        template: payload.template,
        template_data: payload.data,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`);
    }

    const result = await emailResponse.json();
    return {
      success: true,
      email_id: result.id,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email job failed:', error);
    throw error;
  }
}

async function processDataCleanup(payload: DataCleanupPayload): Promise<any> {
  try {
    let query = supabase.from(payload.entity);
    
    // Apply time-based cleanup
    if (payload.older_than_days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - payload.older_than_days);
      query = query.lt('created_at', cutoffDate.toISOString());
    } else if (payload.older_than_hours) {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - payload.older_than_hours);
      query = query.lt('created_at', cutoffDate.toISOString());
    }

    // Apply additional conditions
    if (payload.conditions) {
      Object.entries(payload.conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error, count } = await query.delete().select('*', { count: 'exact' });
    
    if (error) {
      throw error;
    }

    return {
      success: true,
      deleted_count: count || 0,
      message: `Cleaned up ${count || 0} records from ${payload.entity}`,
    };
  } catch (error) {
    console.error('Data cleanup job failed:', error);
    throw error;
  }
}

async function processReportGeneration(payload: ReportGenerationPayload): Promise<any> {
  try {
    // Generate report based on type
    let reportData: any = {};
    
    switch (payload.type) {
      case 'daily':
        reportData = await generateDailyReport(payload);
        break;
      case 'weekly':
        reportData = await generateWeeklyReport(payload);
        break;
      case 'monthly':
        reportData = await generateMonthlyReport(payload);
        break;
      default:
        throw new Error(`Unknown report type: ${payload.type}`);
    }

    // Store report in storage
    const reportFileName = `reports/${payload.type}_${new Date().toISOString().split('T')[0]}.${payload.format}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(reportFileName, JSON.stringify(reportData), {
        contentType: payload.format === 'json' ? 'application/json' : 'text/csv',
      });

    if (uploadError) {
      throw uploadError;
    }

    return {
      success: true,
      report_file: reportFileName,
      report_url: uploadData.path,
      records_count: reportData.total_records || 0,
    };
  } catch (error) {
    console.error('Report generation job failed:', error);
    throw error;
  }
}

async function generateDailyReport(payload: ReportGenerationPayload): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get daily visitor statistics
  const { data: visitorStats } = await supabase
    .from('visitors')
    .select('status, created_at')
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`);

  // Get daily access logs
  const { data: accessLogs } = await supabase
    .from('access_logs')
    .select('action_type, created_at')
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`);

  // Get device status
  const { data: deviceStatus } = await supabase
    .from('iot_devices')
    .select('device_status, device_type');

  return {
    date: today,
    visitor_stats: {
      total: visitorStats?.length || 0,
      checked_in: visitorStats?.filter(v => v.status === 'checked_in').length || 0,
      pending: visitorStats?.filter(v => v.status === 'pending').length || 0,
    },
    access_stats: {
      total_accesses: accessLogs?.length || 0,
      entries: accessLogs?.filter(log => log.action_type === 'entry').length || 0,
      exits: accessLogs?.filter(log => log.action_type === 'exit').length || 0,
    },
    device_stats: {
      total_devices: deviceStatus?.length || 0,
      online: deviceStatus?.filter(d => d.device_status === 'online').length || 0,
      offline: deviceStatus?.filter(d => d.device_status === 'offline').length || 0,
    },
    total_records: (visitorStats?.length || 0) + (accessLogs?.length || 0),
  };
}

async function generateWeeklyReport(payload: ReportGenerationPayload): Promise<any> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  // Implementation similar to daily report but for week range
  return {
    period: 'weekly',
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    // Add weekly aggregations here
  };
}

async function generateMonthlyReport(payload: ReportGenerationPayload): Promise<any> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1);

  // Implementation similar to daily report but for month range
  return {
    period: 'monthly',
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    // Add monthly aggregations here
  };
}

async function processDeviceSync(payload: any): Promise<any> {
  try {
    // Sync IoT device data
    const { data: devices } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('device_status', 'online');

    const syncResults: SyncResult[] = [];
    
    for (const device of devices || []) {
      try {
        // Simulate device data sync
        const deviceResponse = await fetch(`${device.api_endpoint}/status`, {
          headers: {
            'Authorization': `Bearer ${device.api_key}`,
          },
        });

        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json();
          
          // Update device status
          await supabase
            .from('iot_devices')
            .update({
              last_seen: new Date().toISOString(),
              device_data: deviceData,
            })
            .eq('id', device.id);

          syncResults.push({
            device_id: device.id,
            status: 'success',
            last_sync: new Date().toISOString(),
          });
        }
      } catch (deviceError: any) {
        syncResults.push({
          device_id: device.id,
          status: 'failed',
          error: deviceError.message,
        });
      }
    }

    return {
      success: true,
      synced_devices: syncResults.filter(r => r.status === 'success').length,
      failed_devices: syncResults.filter(r => r.status === 'failed').length,
      results: syncResults,
    };
  } catch (error) {
    console.error('Device sync job failed:', error);
    throw error;
  }
}

async function processSecurityScan(payload: any): Promise<any> {
  try {
    // Perform security checks
    const securityChecks = {
      suspicious_logins: 0,
      failed_accesses: 0,
      device_anomalies: 0,
      data_breaches: 0,
    };

    // Check for suspicious login patterns
    const { data: recentLogins } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action_type', 'login')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Check for failed access attempts
    const { data: failedAccesses } = await supabase
      .from('access_logs')
      .select('*')
      .eq('action_type', 'denied')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    securityChecks.failed_accesses = failedAccesses?.length || 0;

    // Log security scan results
    await supabase
      .from('audit_logs')
      .insert({
        action_type: 'security_scan',
        details: securityChecks,
        created_at: new Date().toISOString(),
      });

    return {
      success: true,
      scan_timestamp: new Date().toISOString(),
      security_score: calculateSecurityScore(securityChecks),
      findings: securityChecks,
    };
  } catch (error) {
    console.error('Security scan job failed:', error);
    throw error;
  }
}

function calculateSecurityScore(checks: any): number {
  // Simple security scoring algorithm
  let score = 100;
  score -= checks.suspicious_logins * 10;
  score -= checks.failed_accesses * 5;
  score -= checks.device_anomalies * 15;
  score -= checks.data_breaches * 50;
  return Math.max(0, score);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get next job from queue
    const { data: jobs, error: jobError } = await supabase
      .rpc('get_next_job');

    if (jobError) {
      throw jobError;
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No jobs available',
        processed: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job: Job = jobs[0];
    let result: any;
    let status = 'completed';
    let errorMessage: string | null = null;

    try {
      // Process job based on type
      switch (job.job_type) {
        case 'send_email':
          result = await processEmailJob(job.job_payload);
          break;
        case 'data_cleanup':
          result = await processDataCleanup(job.job_payload);
          break;
        case 'report_generation':
          result = await processReportGeneration(job.job_payload);
          break;
        case 'device_sync':
          result = await processDeviceSync(job.job_payload);
          break;
        case 'security_check':
          result = await processSecurityScan(job.job_payload);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }
    } catch (jobError) {
      status = 'failed';
      errorMessage = jobError.message;
      result = { error: jobError.message };
    }

    // Mark job as completed or failed
    const { error: completeError } = await supabase
      .rpc('complete_job', {
        p_job_id: job.job_id,
        p_status: status,
        p_result: result,
        p_error_message: errorMessage,
      });

    if (completeError) {
      console.error('Failed to complete job:', completeError);
    }

    return new Response(JSON.stringify({
      job_id: job.job_id,
      job_type: job.job_type,
      status: status,
      result: result,
      processed: 1,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Job processor error:', error);
    return new Response(JSON.stringify({
      error: 'Job processing failed',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

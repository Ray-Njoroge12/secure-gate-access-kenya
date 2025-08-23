-- Background Job Processing System
-- Phase 1: High Priority - Job Queue and Processing Infrastructure

-- 1. Job Queue Tables
CREATE TABLE job_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL,
  job_payload JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Job Templates for Common Tasks
CREATE TABLE job_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  default_payload JSONB NOT NULL DEFAULT '{}',
  default_priority INTEGER DEFAULT 5,
  max_attempts INTEGER DEFAULT 3,
  timeout_minutes INTEGER DEFAULT 30,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Job Execution History
CREATE TABLE job_execution_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_queue(id) ON DELETE CASCADE,
  execution_start TIMESTAMPTZ NOT NULL,
  execution_end TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL,
  error_details JSONB,
  performance_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Recurring Job Schedule
CREATE TABLE recurring_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  job_payload JSONB NOT NULL DEFAULT '{}',
  cron_expression VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Job Queue Indexes for Performance
CREATE INDEX idx_job_queue_status_priority ON job_queue (status, priority DESC, scheduled_at);
CREATE INDEX idx_job_queue_tenant_type ON job_queue (tenant_id, job_type, created_at DESC);
CREATE INDEX idx_job_queue_scheduled_pending ON job_queue (scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_recurring_jobs_next_run ON recurring_jobs (next_run_at) WHERE is_active = true;
CREATE INDEX idx_job_execution_history_job_start ON job_execution_history (job_id, execution_start DESC);

-- 6. Job Processing Functions
CREATE OR REPLACE FUNCTION enqueue_job(
  p_tenant_id UUID,
  p_job_type VARCHAR(50),
  p_job_payload JSONB DEFAULT '{}',
  p_priority INTEGER DEFAULT 5,
  p_scheduled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO job_queue (tenant_id, job_type, job_payload, priority, scheduled_at)
  VALUES (p_tenant_id, p_job_type, p_job_payload, p_priority, p_scheduled_at)
  RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Get Next Job Function
CREATE OR REPLACE FUNCTION get_next_job()
RETURNS TABLE (
  job_id UUID,
  tenant_id UUID,
  job_type VARCHAR(50),
  job_payload JSONB,
  priority INTEGER
) AS $$
DECLARE
  selected_job RECORD;
BEGIN
  -- Select and lock the highest priority pending job
  SELECT q.id, q.tenant_id, q.job_type, q.job_payload, q.priority
  INTO selected_job
  FROM job_queue q
  WHERE q.status = 'pending' 
    AND q.scheduled_at <= NOW()
    AND q.attempts < q.max_attempts
  ORDER BY q.priority DESC, q.scheduled_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF FOUND THEN
    -- Mark job as processing
    UPDATE job_queue 
    SET status = 'processing', 
        started_at = NOW(),
        attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = selected_job.id;
    
    -- Return job details
    RETURN QUERY
    SELECT selected_job.id, selected_job.tenant_id, selected_job.job_type, 
           selected_job.job_payload, selected_job.priority;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Complete Job Function
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_status VARCHAR(20),
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE job_queue
  SET status = p_status,
      completed_at = NOW(),
      result = p_result,
      error_message = p_error_message,
      updated_at = NOW()
  WHERE id = p_job_id;
  
  -- Log execution history
  INSERT INTO job_execution_history (job_id, execution_start, execution_end, status, error_details)
  SELECT id, started_at, NOW(), p_status, 
         CASE WHEN p_error_message IS NOT NULL THEN jsonb_build_object('error', p_error_message) ELSE NULL END
  FROM job_queue WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Retry Failed Jobs Function
CREATE OR REPLACE FUNCTION retry_failed_jobs()
RETURNS INTEGER AS $$
DECLARE
  retry_count INTEGER;
BEGIN
  UPDATE job_queue
  SET status = 'pending',
      scheduled_at = NOW() + INTERVAL '5 minutes',
      error_message = NULL,
      updated_at = NOW()
  WHERE status = 'failed' 
    AND attempts < max_attempts;
  
  GET DIAGNOSTICS retry_count = ROW_COUNT;
  RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Job Queue Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_completed_jobs(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM job_queue
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '1 day' * p_retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Insert Job Templates for Common Tasks
INSERT INTO job_templates (template_name, job_type, default_payload, default_priority, description) VALUES
('email_invitation', 'send_email', '{"template": "invitation", "type": "invitation"}', 7, 'Send invitation email to visitors'),
('email_reminder', 'send_email', '{"template": "reminder", "type": "reminder"}', 5, 'Send reminder emails'),
('visitor_cleanup', 'data_cleanup', '{"entity": "visitors", "older_than_days": 90}', 3, 'Clean up old visitor records'),
('generate_report', 'report_generation', '{"type": "daily", "format": "pdf"}', 4, 'Generate daily reports'),
('export_data', 'data_export', '{"format": "csv", "compression": true}', 6, 'Export data to external systems'),
('backup_photos', 'file_backup', '{"source": "visitor_photos", "destination": "archive"}', 2, 'Backup visitor photos'),
('sync_devices', 'device_sync', '{"sync_type": "status", "include_telemetry": true}', 8, 'Synchronize IoT device data'),
('security_scan', 'security_check', '{"scan_type": "vulnerability", "deep_scan": false}', 9, 'Perform security scans'),
('audit_log_archive', 'data_archive', '{"entity": "audit_logs", "older_than_days": 365}', 1, 'Archive old audit logs'),
('notification_digest', 'send_notification', '{"type": "digest", "frequency": "daily"}', 5, 'Send notification digests');

-- 12. Insert Recurring Job Examples
INSERT INTO recurring_jobs (tenant_id, job_name, job_type, job_payload, cron_expression, next_run_at) 
SELECT 
  id as tenant_id,
  'Daily Cleanup',
  'data_cleanup',
  '{"entity": "temporary_files", "older_than_hours": 24}',
  '0 2 * * *',
  NOW() + INTERVAL '1 day'
FROM tenants LIMIT 1;

-- 13. Job Queue Monitoring Views
CREATE OR REPLACE VIEW job_queue_status AS
SELECT 
  job_type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))) as avg_duration_seconds,
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job
FROM job_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY job_type, status
ORDER BY job_type, status;

CREATE OR REPLACE VIEW job_performance_metrics AS
SELECT 
  job_type,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate_percent,
  AVG(CASE WHEN status = 'completed' THEN 
    EXTRACT(EPOCH FROM (completed_at - started_at)) 
  END) as avg_execution_time_seconds
FROM job_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY job_type
ORDER BY total_jobs DESC;

-- 14. Job Queue Triggers
CREATE OR REPLACE FUNCTION update_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW EXECUTE FUNCTION update_job_timestamp();

CREATE TRIGGER trigger_recurring_jobs_updated_at
  BEFORE UPDATE ON recurring_jobs
  FOR EACH ROW EXECUTE FUNCTION update_job_timestamp();

-- 15. Job Queue Security and RLS
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY job_queue_tenant_isolation ON job_queue
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY recurring_jobs_tenant_isolation ON recurring_jobs
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Allow service role to access all jobs
CREATE POLICY job_queue_service_role ON job_queue
  USING (auth.role() = 'service_role');

CREATE POLICY recurring_jobs_service_role ON recurring_jobs
  USING (auth.role() = 'service_role');

COMMENT ON TABLE job_queue IS 'Asynchronous job queue for background processing';
COMMENT ON TABLE job_templates IS 'Predefined job templates for common tasks';
COMMENT ON TABLE job_execution_history IS 'Historical log of job executions';
COMMENT ON TABLE recurring_jobs IS 'Scheduled recurring jobs configuration';

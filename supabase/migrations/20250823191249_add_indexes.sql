-- Performance-critical index used by guard lookups & dashboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_status_created
ON visitors (status, created_at DESC)
WHERE status IN ('checked_in','pending','approved');

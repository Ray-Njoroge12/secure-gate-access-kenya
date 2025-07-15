-- Automatically delete visitors after 30 days from last visit or invitation expiry
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMP;

DROP FUNCTION IF EXISTS clean_old_invitations();

CREATE OR REPLACE FUNCTION clean_old_invitations()
RETURNS VOID AS $$
DECLARE
    retention_days INTEGER := 30;
BEGIN
    -- Delete old access codes
    DELETE FROM access_codes
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    -- Delete old visit invitations
    DELETE FROM visit_invitations
    WHERE expires_at < NOW() - INTERVAL '1 day' * retention_days;

    -- Delete visitors whose last_visit_at or latest invitation expiry is older than 30 days
    DELETE FROM visitors
    WHERE (last_visit_at IS NOT NULL AND last_visit_at < NOW() - INTERVAL '1 day' * retention_days)
       OR (last_visit_at IS NULL AND id IN (
            SELECT visitor_id FROM visit_invitations
            GROUP BY visitor_id
            HAVING MAX(expires_at) < NOW() - INTERVAL '1 day' * retention_days
         ));
END;
$$ LANGUAGE plpgsql;
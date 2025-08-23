CREATE OR REPLACE FUNCTION clean_old_invitations()
RETURNS VOID AS $$
DECLARE
    retention_days INTEGER;
BEGIN
    -- Get retention days from system_settings, default to 365 if not found
    SELECT (setting_value->>'pii_retention_days')::int INTO retention_days
    FROM system_settings
    WHERE setting_name = 'pii_retention_days';

    IF retention_days IS NULL THEN
        retention_days := 365; -- Default to 1 year
    END IF;

    -- Delete old access codes
    DELETE FROM access_codes
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    -- Delete old visit invitations
    DELETE FROM visit_invitations
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;

    RAISE NOTICE 'Cleaned up data older than % days.', retention_days;
END;
$$
LANGUAGE plpgsql;
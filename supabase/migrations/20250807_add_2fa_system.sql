-- Two-Factor Authentication System Migration
-- Creates tables and functions for TOTP-based 2FA with backup codes

-- Create 2FA settings table
CREATE TABLE IF NOT EXISTS user_2fa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret_key_encrypted BYTEA NOT NULL,
    backup_codes_encrypted BYTEA[],
    enabled BOOLEAN DEFAULT false,
    setup_completed_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create 2FA verification attempts table for rate limiting
CREATE TABLE IF NOT EXISTS user_2fa_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN ('setup', 'login', 'backup')),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP DEFAULT NOW(),
    INDEX (user_id, attempted_at)
);

-- Enable RLS on both tables
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for 2FA settings
CREATE POLICY "Users can view their own 2FA settings" ON user_2fa_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON user_2fa_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON user_2fa_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for 2FA attempts (read-only for users)
CREATE POLICY "Users can view their own 2FA attempts" ON user_2fa_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Function to check if user has 2FA enabled
CREATE OR REPLACE FUNCTION user_has_2fa_enabled(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_2fa_settings 
        WHERE user_id = user_uuid AND enabled = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log 2FA attempts
CREATE OR REPLACE FUNCTION log_2fa_attempt(
    user_uuid UUID,
    attempt_type_param VARCHAR(20),
    success_param BOOLEAN,
    ip_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_2fa_attempts (user_id, attempt_type, success, ip_address, user_agent)
    VALUES (user_uuid, attempt_type_param, success_param, ip_param, user_agent_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limiting for 2FA attempts
CREATE OR REPLACE FUNCTION check_2fa_rate_limit(user_uuid UUID, attempt_type_param VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    recent_attempts INTEGER;
BEGIN
    -- Count failed attempts in the last 15 minutes
    SELECT COUNT(*) INTO recent_attempts
    FROM user_2fa_attempts
    WHERE user_id = user_uuid 
        AND attempt_type = attempt_type_param 
        AND success = false
        AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    -- Allow max 5 failed attempts per 15 minutes
    RETURN recent_attempts < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at
CREATE TRIGGER update_user_2fa_settings_updated_at
    BEFORE UPDATE ON user_2fa_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
-- Terms & Conditions and GDPR Compliance System Migration
-- Creates tables for versioned terms, user consents, and privacy compliance

-- Create terms versions table
CREATE TABLE IF NOT EXISTS terms_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    privacy_policy TEXT NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_current BOOLEAN DEFAULT false,
    INDEX (version),
    INDEX (effective_date)
);

-- Create user consents table
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version INTEGER NOT NULL REFERENCES terms_versions(version),
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'marketing', 'cookies')),
    consented BOOLEAN NOT NULL,
    consented_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    withdrawn_at TIMESTAMP,
    UNIQUE(user_id, terms_version, consent_type)
);

-- Create GDPR data requests table
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'delete', 'correct', 'restrict')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    data_export_url TEXT, -- For data export requests
    INDEX (user_id, request_type),
    INDEX (status, requested_at)
);

-- Enable RLS on all tables
ALTER TABLE terms_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for terms versions (public read access for current version)
CREATE POLICY "Anyone can view current terms version" ON terms_versions
    FOR SELECT USING (is_current = true);

CREATE POLICY "Admins can manage terms versions" ON terms_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM residents r 
            JOIN user_roles ur ON r.id = ur.user_id 
            WHERE r.id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
    );

-- RLS policies for user consents
CREATE POLICY "Users can view their own consents" ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON user_consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM residents r 
            JOIN user_roles ur ON r.id = ur.user_id 
            WHERE r.id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
    );

-- RLS policies for GDPR requests
CREATE POLICY "Users can view their own GDPR requests" ON gdpr_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GDPR requests" ON gdpr_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all GDPR requests" ON gdpr_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM residents r 
            JOIN user_roles ur ON r.id = ur.user_id 
            WHERE r.id = auth.uid() AND ur.role IN ('admin', 'super_admin')
        )
    );

-- Function to get current terms version
CREATE OR REPLACE FUNCTION get_current_terms()
RETURNS TABLE (
    version INTEGER,
    title VARCHAR(255),
    content TEXT,
    privacy_policy TEXT,
    effective_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT tv.version, tv.title, tv.content, tv.privacy_policy, tv.effective_date
    FROM terms_versions tv
    WHERE tv.is_current = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has consented to current terms
CREATE OR REPLACE FUNCTION user_has_current_consent(user_uuid UUID, consent_type_param VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    current_version INTEGER;
    has_consent BOOLEAN;
BEGIN
    -- Get current terms version
    SELECT version INTO current_version
    FROM terms_versions
    WHERE is_current = true;
    
    -- Check if user has consented to current version
    SELECT (consented = true AND withdrawn_at IS NULL) INTO has_consent
    FROM user_consents
    WHERE user_id = user_uuid 
        AND terms_version = current_version 
        AND consent_type = consent_type_param;
    
    RETURN COALESCE(has_consent, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user consent
CREATE OR REPLACE FUNCTION record_user_consent(
    user_uuid UUID,
    consent_type_param VARCHAR(50),
    consented_param BOOLEAN,
    ip_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_version INTEGER;
BEGIN
    -- Get current terms version
    SELECT version INTO current_version
    FROM terms_versions
    WHERE is_current = true;
    
    -- Insert or update consent record
    INSERT INTO user_consents (user_id, terms_version, consent_type, consented, ip_address, user_agent)
    VALUES (user_uuid, current_version, consent_type_param, consented_param, ip_param, user_agent_param)
    ON CONFLICT (user_id, terms_version, consent_type)
    DO UPDATE SET
        consented = EXCLUDED.consented,
        consented_at = NOW(),
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        withdrawn_at = CASE 
            WHEN EXCLUDED.consented = false THEN NOW()
            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new terms version
CREATE OR REPLACE FUNCTION create_terms_version(
    version_param INTEGER,
    title_param VARCHAR(255),
    content_param TEXT,
    privacy_policy_param TEXT,
    effective_date_param TIMESTAMP,
    make_current BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    new_terms_id UUID;
BEGIN
    -- If making this current, update previous current version
    IF make_current THEN
        UPDATE terms_versions SET is_current = false WHERE is_current = true;
    END IF;
    
    -- Create new terms version
    INSERT INTO terms_versions (version, title, content, privacy_policy, effective_date, is_current, created_by)
    VALUES (version_param, title_param, content_param, privacy_policy_param, effective_date_param, make_current, auth.uid())
    RETURNING id INTO new_terms_id;
    
    RETURN new_terms_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial terms version
INSERT INTO terms_versions (
    version, 
    title, 
    content, 
    privacy_policy, 
    effective_date, 
    is_current,
    created_by
) VALUES (
    1,
    'SecureGate Kenya Terms of Service',
    'Welcome to SecureGate Kenya, a visitor management system designed to enhance security and streamline access control for residential and commercial properties.

## 1. Acceptance of Terms

By accessing and using SecureGate Kenya, you accept and agree to be bound by these terms and conditions.

## 2. User Responsibilities

- Provide accurate information when registering
- Maintain the confidentiality of your account credentials
- Use the system only for legitimate visitor management purposes
- Comply with all applicable laws and regulations

## 3. Privacy and Data Protection

We are committed to protecting your privacy and personal data in accordance with applicable data protection laws.

## 4. System Usage

- The system is provided for visitor management purposes only
- Users must not attempt to compromise system security
- Misuse of the system may result in account termination

## 5. Limitations of Liability

SecureGate Kenya is provided "as is" without warranties of any kind.

## 6. Changes to Terms

We reserve the right to modify these terms at any time. Users will be notified of significant changes.

## 7. Contact Information

For questions about these terms, please contact our support team.',
    'SecureGate Kenya Privacy Policy

## Data Collection and Use

We collect and process personal information necessary for visitor management, including:
- Contact information (name, phone, email)
- Visit details and access logs
- Security-related data

## Data Protection

- All personal data is encrypted using industry-standard encryption
- Access to data is strictly controlled and logged
- Data retention policies ensure information is not kept longer than necessary

## Your Rights

Under GDPR and applicable data protection laws, you have the right to:
- Access your personal data
- Correct inaccurate information
- Request deletion of your data
- Restrict processing of your data
- Data portability

## Contact for Privacy Matters

For privacy-related inquiries, contact our Data Protection Officer.',
    NOW(),
    true,
    NULL
) ON CONFLICT (version) DO NOTHING;
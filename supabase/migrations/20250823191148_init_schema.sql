-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Communities
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Residents
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_encrypted BYTEA NOT NULL, -- AES-256-GCM ciphertext
    unit_number VARCHAR(50) NOT NULL,
    community_id UUID NOT NULL REFERENCES communities(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ
);

-- 3) Visitors
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name_encrypted BYTEA NOT NULL,     -- AES-256-GCM
    id_number_hash VARCHAR(64) NOT NULL,    -- SHA-256 lookup
    id_number_encrypted BYTEA NOT NULL,     -- AES-256-GCM
    phone_encrypted BYTEA NOT NULL,         -- AES-256-GCM
    email_encrypted BYTEA,                  -- AES-256-GCM
    photo_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- <-- needed for later index
    created_at TIMESTAMPTZ DEFAULT NOW(),
    gdpr_consent BOOLEAN DEFAULT FALSE,
    data_retention_until TIMESTAMPTZ
);

-- 4) Visit invitations
CREATE TABLE IF NOT EXISTS visit_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id),
    visitor_full_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_email VARCHAR(255),
    visit_purpose VARCHAR(100) NOT NULL,
    visit_date TIMESTAMPTZ NOT NULL,
    visit_duration_hours INTEGER DEFAULT 4,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Access codes
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES visitors(id),
    resident_id UUID NOT NULL REFERENCES residents(id),
    invitation_id UUID NOT NULL REFERENCES visit_invitations(id),
    pin_hash VARCHAR(64) NOT NULL,          -- Argon2id digest (keep per your spec)
    qr_token TEXT NOT NULL,                 -- RS256-signed JWT
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- 6) Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_type VARCHAR(50),
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

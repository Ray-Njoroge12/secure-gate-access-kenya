-- Create communities table first (referenced by residents)
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create residents table
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_encrypted BYTEA NOT NULL, -- Encrypted phone number (AES-256-GCM)
    unit_number VARCHAR(50) NOT NULL,
    community_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    CONSTRAINT fk_community FOREIGN KEY (community_id) REFERENCES communities(id)
);

-- Create visitors table
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name_encrypted BYTEA NOT NULL, -- Encrypted full name (AES-256-GCM)
    id_number_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for lookup
    id_number_encrypted BYTEA NOT NULL, -- Encrypted ID number (AES-256-GCM)
    phone_encrypted BYTEA NOT NULL, -- Encrypted phone number (AES-256-GCM)
    email_encrypted BYTEA, -- Encrypted email (AES-256-GCM)
    photo_url VARCHAR(500), -- S3 URL with signed access for temporary access
    created_at TIMESTAMP DEFAULT NOW(),
    gdpr_consent BOOLEAN DEFAULT FALSE, -- Explicit consent for data processing
    data_retention_until TIMESTAMP -- Data retention policy enforcement
);

-- Create visit invitations table
CREATE TABLE visit_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL,
    visitor_full_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_email VARCHAR(255),
    visit_purpose VARCHAR(100) NOT NULL,
    visit_date TIMESTAMP NOT NULL,
    visit_duration_hours INTEGER DEFAULT 4,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_resident FOREIGN KEY (resident_id) REFERENCES residents(id)
);

-- Create access_codes table
CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    invitation_id UUID NOT NULL,
    pin_hash VARCHAR(64) NOT NULL, -- Argon2id hash of the PIN
    qr_token TEXT NOT NULL, -- Signed JWT token
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    CONSTRAINT fk_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id),
    CONSTRAINT fk_resident FOREIGN KEY (resident_id) REFERENCES residents(id),
    CONSTRAINT fk_invitation FOREIGN KEY (invitation_id) REFERENCES visit_invitations(id)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_type VARCHAR(50),
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample community for development
INSERT INTO communities (name, address, phone) 
VALUES ('Kileleshwa Heights', 'Kileleshwa, Nairobi', '+254700000000');

-- Insert sample resident for development
INSERT INTO residents (email, phone_encrypted, unit_number, community_id)
VALUES ('resident@test.com', '\x746573745f656e637279707465645f70686f6e65'::bytea, 'A101', 
        (SELECT id FROM communities WHERE name = 'Kileleshwa Heights'));
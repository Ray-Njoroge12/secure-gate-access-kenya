
-- Add pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt data using AES-256-GCM
CREATE OR REPLACE FUNCTION public.encrypt_data(
    data BYTEA,
    key TEXT
)
RETURNS BYTEA AS $$
BEGIN
    RETURN pg_catalog.pgp_sym_encrypt_bytea(data, key::bytea, 'aes256');
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt data using AES-256-GCM
CREATE OR REPLACE FUNCTION public.decrypt_data(
    encrypted_data BYTEA,
    key TEXT
)
RETURNS BYTEA AS $$
BEGIN
    RETURN pg_catalog.pgp_sym_decrypt_bytea(encrypted_data, key::bytea, 'aes256');
END;
$$ LANGUAGE plpgsql;

-- Function to hash data using SHA-256
CREATE OR REPLACE FUNCTION public.hash_sha256(
    data TEXT
)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN ENCODE(SHA256(data::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Update visitors table to use encryption and hashing
ALTER TABLE public.visitors
ALTER COLUMN full_name_encrypted TYPE BYTEA USING public.encrypt_data(full_name_encrypted::text::bytea, 'YOUR_ENCRYPTION_KEY_HERE'),
ALTER COLUMN id_number_hash TYPE VARCHAR(64) USING public.hash_sha256(id_number_hash),
ALTER COLUMN id_number_encrypted TYPE BYTEA USING public.encrypt_data(id_number_encrypted::text::bytea, 'YOUR_ENCRYPTION_KEY_HERE'),
ALTER COLUMN phone_encrypted TYPE BYTEA USING public.encrypt_data(phone_encrypted::text::bytea, 'YOUR_ENCRYPTION_KEY_HERE'),
ALTER COLUMN email_encrypted TYPE BYTEA USING public.encrypt_data(email_encrypted::text::bytea, 'YOUR_ENCRYPTION_KEY_HERE');

-- Update residents table to use encryption
ALTER TABLE public.residents
ALTER COLUMN phone_encrypted TYPE BYTEA USING public.encrypt_data(phone_encrypted::text::bytea, 'YOUR_ENCRYPTION_KEY_HERE');

-- Note: The 'YOUR_ENCRYPTION_KEY_HERE' placeholder must be replaced with a securely managed key.
-- For production, consider using Supabase secrets or environment variables for the key.

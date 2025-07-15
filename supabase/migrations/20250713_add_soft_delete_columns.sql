-- Add soft-delete column to residents
ALTER TABLE residents ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP;

-- Add soft-delete column to visitors
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP;
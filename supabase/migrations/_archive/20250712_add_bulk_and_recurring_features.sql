-- Add bulk invitations support
CREATE TABLE bulk_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    total_records INTEGER NOT NULL,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add bulk invitation details
CREATE TABLE bulk_invitation_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_invitation_id UUID REFERENCES bulk_invitations(id) ON DELETE CASCADE NOT NULL,
    row_number INTEGER NOT NULL,
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    visit_purpose TEXT,
    visit_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Extend pre_approved_visitors for recurring visitors
ALTER TABLE pre_approved_visitors 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_rule JSONB,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_multi_use BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS uses_remaining INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS visitor_full_name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS visitor_phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS visitor_email_encrypted TEXT;

-- Add blacklist table
CREATE TABLE blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT,
    visitor_phone TEXT,
    reason TEXT NOT NULL,
    blacklisted_by UUID REFERENCES profiles(id),
    expires_at DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_bulk_invitations_resident_id ON bulk_invitations(resident_id);
CREATE INDEX idx_bulk_invitations_status ON bulk_invitations(status);
CREATE INDEX idx_bulk_invitation_details_bulk_invitation_id ON bulk_invitation_details(bulk_invitation_id);
CREATE INDEX idx_pre_approved_visitors_recurring ON pre_approved_visitors(resident_id, is_recurring);
CREATE INDEX idx_blacklist_resident_id ON blacklist(resident_id);
CREATE INDEX idx_blacklist_active ON blacklist(is_active, expires_at);

-- Enable RLS for new tables
ALTER TABLE bulk_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_invitation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_invitations
CREATE POLICY "Residents can view their own bulk invitations" ON bulk_invitations
  FOR SELECT TO authenticated USING (auth.uid() = resident_id);

CREATE POLICY "Residents can insert their own bulk invitations" ON bulk_invitations
  FOR INSERT WITH CHECK (auth.uid() = resident_id);

-- RLS Policies for bulk_invitation_details
CREATE POLICY "Residents can view their own bulk invitation details" ON bulk_invitation_details
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM bulk_invitations 
      WHERE bulk_invitations.id = bulk_invitation_details.bulk_invitation_id 
      AND bulk_invitations.resident_id = auth.uid()
    )
  );

-- RLS Policies for blacklist
CREATE POLICY "Residents can view their own blacklist" ON blacklist
  FOR SELECT TO authenticated USING (auth.uid() = resident_id);

CREATE POLICY "Residents can insert their own blacklist" ON blacklist
  FOR INSERT WITH CHECK (auth.uid() = resident_id);

CREATE POLICY "Residents can update their own blacklist" ON blacklist
  FOR UPDATE USING (auth.uid() = resident_id);

CREATE POLICY "Residents can delete their own blacklist" ON blacklist
  FOR DELETE USING (auth.uid() = resident_id);

CREATE TABLE pre_approved_visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    relationship TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pre_approved_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents can view their own pre-approved visitors." ON pre_approved_visitors
  FOR SELECT TO authenticated USING (auth.uid() = resident_id);

CREATE POLICY "Residents can insert their own pre-approved visitors." ON pre_approved_visitors
  FOR INSERT WITH CHECK (auth.uid() = resident_id);

CREATE POLICY "Residents can update their own pre-approved visitors." ON pre_approved_visitors
  FOR UPDATE USING (auth.uid() = resident_id);

CREATE POLICY "Residents can delete their own pre-approved visitors." ON pre_approved_visitors
  FOR DELETE USING (auth.uid() = resident_id);
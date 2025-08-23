CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guard_id UUID REFERENCES guards(user_id) ON DELETE SET NULL,
    incident_type TEXT NOT NULL,
    description TEXT,
    incident_time TIMESTAMPTZ DEFAULT now(),
    location TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guards can create incidents." ON incidents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Guards can view their own incidents." ON incidents
  FOR SELECT TO authenticated USING (guard_id = auth.uid());

CREATE POLICY "Admins can view all incidents." ON incidents
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update incidents." ON incidents
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
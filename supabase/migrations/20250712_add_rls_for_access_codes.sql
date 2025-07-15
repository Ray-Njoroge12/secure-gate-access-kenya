
-- Enable Row Level Security for the access_codes table
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Policy for residents to view access codes associated with their invitations
CREATE POLICY "Residents can view their access codes"
ON public.access_codes
FOR SELECT
USING (resident_id = auth.uid());

-- Policy for security guards to view access codes (refined to check for guard role)
CREATE POLICY "Security guards can view access codes"
ON public.access_codes
FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guard'));

-- Policy to allow the system to insert access codes (e.g., by generate-access-code function)
-- This policy assumes the function runs with a service role key, bypassing RLS, but is good practice.
CREATE POLICY "System can insert access codes"
ON public.access_codes
FOR INSERT
WITH CHECK (true); -- This needs to be refined with proper RBAC for system users/functions

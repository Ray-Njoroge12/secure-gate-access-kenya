
-- Enable Row Level Security for the access_codes table
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Policy for residents to view access codes associated with their invitations
CREATE POLICY "Residents can view their access codes"
ON public.access_codes
FOR SELECT
USING (resident_id = auth.uid());

-- Policy for security guards to view access codes (assuming guards are authenticated and have a specific role/permission)
-- For now, this policy allows all authenticated users to select, which will be refined with proper guard roles.
CREATE POLICY "Security guards can view access codes"
ON public.access_codes
FOR SELECT
USING (true); -- This needs to be refined with proper RBAC for guards

-- Policy to allow the system to insert access codes (e.g., by generate-access-code function)
-- This policy assumes the function runs with a service role key, bypassing RLS, but is good practice.
CREATE POLICY "System can insert access codes"
ON public.access_codes
FOR INSERT
WITH CHECK (true); -- This needs to be refined with proper RBAC for system users/functions

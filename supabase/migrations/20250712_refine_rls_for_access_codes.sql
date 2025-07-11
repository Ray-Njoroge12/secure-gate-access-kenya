
-- Refine RLS for access_codes to include guard role check

-- Drop the existing broad policy for security guards
DROP POLICY IF EXISTS "Security guards can view access codes" ON public.access_codes;

-- Create a new policy that checks for a 'guard' role in the user's JWT claims
CREATE POLICY "Security guards with 'guard' role can view access codes"
ON public.access_codes
FOR SELECT
USING (auth.role() = 'guard');

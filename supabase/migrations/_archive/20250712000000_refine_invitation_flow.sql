
-- Refine the visit invitation and visitor registration flow

-- Step 1: Add a nullable visitor_id to the visit_invitations table
-- This will be populated after the visitor completes self-registration.
ALTER TABLE public.visit_invitations
ADD COLUMN visitor_id UUID,
ADD CONSTRAINT fk_visitor_invitation FOREIGN KEY (visitor_id) REFERENCES visitors(id);

-- Step 2: Add a status to the visitors table to track registration completion
ALTER TABLE public.visitors
ADD COLUMN registration_status VARCHAR(20) DEFAULT 'pending' CHECK (registration_status IN ('pending', 'completed'));

-- Step 3: Remove redundant visitor detail columns from visit_invitations
-- These details should be stored only in the 'visitors' table after self-registration.
ALTER TABLE public.visit_invitations
DROP COLUMN visitor_full_name,
DROP COLUMN visitor_phone,
DROP COLUMN visitor_email;

-- Step 4: Update RLS policies to reflect the new schema
-- Allow residents to see invitations they created
DROP POLICY "Residents can view their own invitations" ON public.visit_invitations;
CREATE POLICY "Residents can manage their own invitations"
ON public.visit_invitations
FOR ALL
USING (resident_id = auth.uid());

-- Allow visitors to view the invitation they are associated with
CREATE POLICY "Visitors can view their own invitation"
ON public.visit_invitations
FOR SELECT
USING (visitor_id = auth.uid());

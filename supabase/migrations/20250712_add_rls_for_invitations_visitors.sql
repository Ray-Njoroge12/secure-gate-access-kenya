
-- Enable Row Level Security for the visit_invitations table
ALTER TABLE public.visit_invitations ENABLE ROW LEVEL SECURITY;

-- Policy for residents to manage their own invitations
CREATE POLICY "Residents can manage their own invitations"
ON public.visit_invitations
FOR ALL
USING (resident_id = auth.uid());

-- Policy for visitors to view their own invitation
CREATE POLICY "Visitors can view their own invitation"
ON public.visit_invitations
FOR SELECT
USING (visitor_id = auth.uid());

-- Enable Row Level Security for the visitors table
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Policy for residents to view visitors associated with their invitations
CREATE POLICY "Residents can view visitors associated with their invitations"
ON public.visitors
FOR SELECT
USING (id IN (SELECT visitor_id FROM public.visit_invitations WHERE resident_id = auth.uid()));

-- Policy for visitors to view their own data
CREATE POLICY "Visitors can view their own data"
ON public.visitors
FOR SELECT
USING (id = auth.uid());

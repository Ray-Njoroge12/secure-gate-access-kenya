-- Create storage bucket for visitor ID photos
INSERT INTO storage.buckets (id, name, public) VALUES ('visitor-photos', 'visitor-photos', false);

-- Create storage policies for visitor photos
CREATE POLICY "Visitors can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'visitor-photos');

CREATE POLICY "Visitors can view their own photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'visitor-photos');

CREATE POLICY "Security guards can view all visitor photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'visitor-photos');

-- Add RLS policies for visit_invitations table
ALTER TABLE public.visit_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents can view their own invitations" 
ON public.visit_invitations 
FOR SELECT 
USING (resident_id = auth.uid());

CREATE POLICY "Residents can create invitations" 
ON public.visit_invitations 
FOR INSERT 
WITH CHECK (resident_id = auth.uid());

CREATE POLICY "Residents can update their own invitations" 
ON public.visit_invitations 
FOR UPDATE 
USING (resident_id = auth.uid());

-- Add RLS policies for access_codes table
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can view their own access codes" 
ON public.access_codes 
FOR SELECT 
USING (visitor_id = auth.uid());

CREATE POLICY "Security guards can view all access codes" 
ON public.access_codes 
FOR SELECT 
USING (true);

CREATE POLICY "System can create access codes" 
ON public.access_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update access codes" 
ON public.access_codes 
FOR UPDATE 
USING (true);

-- Add RLS policies for visitors table
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitors can view their own data" 
ON public.visitors 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Visitors can create their own profile" 
ON public.visitors 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Security guards can view all visitors" 
ON public.visitors 
FOR SELECT 
USING (true);

-- Add RLS policies for residents table
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents can view their own data" 
ON public.residents 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Residents can update their own data" 
ON public.residents 
FOR UPDATE 
USING (id = auth.uid());
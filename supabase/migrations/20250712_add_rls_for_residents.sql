
-- Enable Row Level Security for the residents table
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- Policy for residents to view their own data
CREATE POLICY "Residents can view their own data"
ON public.residents
FOR SELECT
USING (auth.uid() = id);

-- Policy for residents to update their own data
CREATE POLICY "Residents can update their own data"
ON public.residents
FOR UPDATE
USING (auth.uid() = id);

-- Policy to allow authenticated users to insert their own resident profile upon signup
CREATE POLICY "Authenticated users can insert their own resident profile"
ON public.residents
FOR INSERT
WITH CHECK (auth.uid() = id);

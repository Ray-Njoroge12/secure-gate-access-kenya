
-- Create the guards table
CREATE TABLE public.guards (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    community_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    CONSTRAINT fk_community_guard FOREIGN KEY (community_id) REFERENCES communities(id)
);

-- Enable Row Level Security for the guards table
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;

-- Policy for guards to view their own data
CREATE POLICY "Guards can view their own data"
ON public.guards
FOR SELECT
USING (auth.uid() = id);

-- Policy for guards to update their own data
CREATE POLICY "Guards can update their own data"
ON public.guards
FOR UPDATE
USING (auth.uid() = id);

-- Policy to allow system/admin to insert guard profiles
CREATE POLICY "System can insert guard profiles"
ON public.guards
FOR INSERT
WITH CHECK (true); -- This will be refined with proper admin RBAC later

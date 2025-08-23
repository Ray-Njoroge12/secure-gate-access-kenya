-- Update RLS policies for profiles table

-- Remove the existing public access policy
DROP POLICY "Public profiles are viewable by everyone." ON profiles;

-- Create a new policy to allow users to view their own profiles
CREATE POLICY "Users can view their own profiles." ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a policy for guards to view all profiles
CREATE POLICY "Guards can view all profiles." ON profiles
  FOR SELECT USING (auth.role() = 'security_guard');

-- Create a policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles." ON profiles
  FOR SELECT USING (auth.role() = 'admin');

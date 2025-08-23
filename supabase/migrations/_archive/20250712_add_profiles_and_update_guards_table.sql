CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

ALTER TABLE guards
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Optional: Add a unique constraint if a guard should only have one user_id
ALTER TABLE guards
ADD CONSTRAINT unique_guard_user_id UNIQUE (user_id);

-- Optional: Update existing guards to link to auth.users if possible
-- For example, if guard emails match auth.users emails:
-- UPDATE guards
-- SET user_id = auth.users.id
-- FROM auth.users
-- WHERE guards.email = auth.users.email AND guards.user_id IS NULL;

-- Create user_profiles table for customer authentication
-- This table was missing and causing authentication loading delays

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  default_address TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users (admins) can view all profiles
CREATE POLICY "Authenticated users can view all profiles" 
  ON user_profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Add performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'User profiles for customer authentication system';
COMMENT ON COLUMN user_profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN user_profiles.email IS 'User email address';
COMMENT ON COLUMN user_profiles.full_name IS 'User full name';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number';
COMMENT ON COLUMN user_profiles.default_address IS 'User default delivery address';
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences as JSON';

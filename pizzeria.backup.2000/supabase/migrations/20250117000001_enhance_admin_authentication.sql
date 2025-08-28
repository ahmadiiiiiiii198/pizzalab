-- Enhance Admin Authentication System
-- This migration improves admin authentication with better security and functionality

-- 1. Create admin_sessions table for better session management
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_username ON admin_sessions(username);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);

-- Enable RLS for admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_sessions
CREATE POLICY "Admin sessions are private" 
  ON admin_sessions 
  FOR ALL 
  USING (false);

-- 2. Create admin_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_activity_log
CREATE INDEX IF NOT EXISTS idx_admin_activity_username ON admin_activity_log(username);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at);

-- Enable RLS for admin_activity_log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_activity_log
CREATE POLICY "Admin activity log is private" 
  ON admin_activity_log 
  FOR ALL 
  USING (false);

-- 3. Enhance settings table with admin-specific settings
INSERT INTO settings (key, value) VALUES
  (
    'adminSecuritySettings',
    '{
      "sessionTimeout": 86400,
      "maxLoginAttempts": 5,
      "lockoutDuration": 900,
      "requireStrongPassword": true,
      "enableActivityLogging": true
    }'
  ),
  (
    'adminUISettings',
    '{
      "theme": "dark",
      "compactMode": false,
      "showAdvancedFeatures": true,
      "autoSave": true,
      "notificationSound": true
    }'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- 4. Create functions for admin authentication

-- Function to create admin session
CREATE OR REPLACE FUNCTION create_admin_session(
  p_username TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  session_token TEXT;
BEGIN
  -- Generate secure session token
  session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert session record
  INSERT INTO admin_sessions (
    session_token,
    username,
    ip_address,
    user_agent
  ) VALUES (
    session_token,
    p_username,
    p_ip_address,
    p_user_agent
  );
  
  -- Log the login activity
  INSERT INTO admin_activity_log (
    username,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_username,
    'LOGIN',
    jsonb_build_object('success', true),
    p_ip_address,
    p_user_agent
  );
  
  RETURN session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate admin session
CREATE OR REPLACE FUNCTION validate_admin_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  session_valid BOOLEAN := false;
BEGIN
  -- Check if session exists and is valid
  SELECT EXISTS(
    SELECT 1 FROM admin_sessions
    WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > NOW()
  ) INTO session_valid;
  
  -- Update last activity if session is valid
  IF session_valid THEN
    UPDATE admin_sessions
    SET last_activity = NOW()
    WHERE session_token = p_session_token;
  END IF;
  
  RETURN session_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invalidate admin session
CREATE OR REPLACE FUNCTION invalidate_admin_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  session_username TEXT;
BEGIN
  -- Get username before invalidating
  SELECT username INTO session_username
  FROM admin_sessions
  WHERE session_token = p_session_token;
  
  -- Invalidate session
  UPDATE admin_sessions
  SET is_active = false
  WHERE session_token = p_session_token;
  
  -- Log logout activity
  IF session_username IS NOT NULL THEN
    INSERT INTO admin_activity_log (
      username,
      action,
      details
    ) VALUES (
      session_username,
      'LOGOUT',
      jsonb_build_object('session_token', p_session_token)
    );
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Delete expired sessions
  DELETE FROM admin_sessions
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO admin_activity_log (
    username,
    action,
    details
  ) VALUES (
    'SYSTEM',
    'SESSION_CLEANUP',
    jsonb_build_object('cleaned_sessions', cleaned_count)
  );
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_username TEXT,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_activity_log (
    username,
    action,
    resource,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_username,
    p_action,
    p_resource,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION trigger_cleanup_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Cleanup expired sessions when new session is created
  PERFORM cleanup_expired_admin_sessions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_sessions_trigger
  AFTER INSERT ON admin_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_sessions();

-- 6. Add comments for documentation
COMMENT ON TABLE admin_sessions IS 'Admin session management for secure authentication';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for admin activities';
COMMENT ON FUNCTION create_admin_session IS 'Creates a new admin session with security logging';
COMMENT ON FUNCTION validate_admin_session IS 'Validates admin session and updates activity';
COMMENT ON FUNCTION invalidate_admin_session IS 'Invalidates admin session and logs logout';
COMMENT ON FUNCTION cleanup_expired_admin_sessions IS 'Cleans up expired admin sessions';
COMMENT ON FUNCTION log_admin_activity IS 'Logs admin activities for audit trail';

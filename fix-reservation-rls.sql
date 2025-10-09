-- Fix RLS policies for reservation system
-- This fixes the "new row violates row-level security policy" error

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;

-- Create new policies that allow both SELECT and INSERT
CREATE POLICY "Public can view reservation history" ON reservation_status_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert reservation history" ON reservation_status_history
  FOR INSERT WITH CHECK (true);

-- Grant INSERT permission to reservation_status_history table
GRANT INSERT ON reservation_status_history TO anon, authenticated;

-- Also ensure reservations table has proper UPDATE permissions
GRANT UPDATE ON reservations TO anon, authenticated;

-- Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_status_history')
ORDER BY tablename, policyname;

-- Show current grants
SELECT grantee, privilege_type, is_grantable 
FROM information_schema.role_table_grants 
WHERE table_name IN ('reservations', 'reservation_status_history')
ORDER BY table_name, grantee, privilege_type;

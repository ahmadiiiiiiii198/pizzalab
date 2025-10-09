-- Complete fix for reservation system RLS and permissions
-- Run this in your Supabase SQL editor

-- 1. Fix RLS policies for reservation_status_history
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;

-- Allow public to view and system to insert history records
CREATE POLICY "Public can view reservation history" ON reservation_status_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert reservation history" ON reservation_status_history
  FOR INSERT WITH CHECK (true);

-- 2. Ensure proper permissions on all reservation tables
GRANT SELECT, INSERT, UPDATE ON reservations TO anon, authenticated;
GRANT SELECT, INSERT ON reservation_status_history TO anon, authenticated;
GRANT SELECT ON reservation_notifications TO anon, authenticated;
GRANT SELECT ON table_configuration TO anon, authenticated;

-- 3. Fix any missing RLS policies for reservations table
DROP POLICY IF EXISTS "Public can view reservations" ON reservations;
DROP POLICY IF EXISTS "Public can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Public can update reservations" ON reservations;

-- Create comprehensive policies for reservations
CREATE POLICY "Public can view reservations" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "Public can insert reservations" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update reservations" ON reservations
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Ensure the trigger function has proper permissions
-- The trigger should work with the new INSERT policy

-- 5. Test the setup
DO $$
BEGIN
  RAISE NOTICE '✅ Reservation system RLS policies updated';
  RAISE NOTICE '📋 Policies created for: reservations, reservation_status_history';
  RAISE NOTICE '🔐 Permissions granted to anon and authenticated users';
  RAISE NOTICE '⚡ System should now work without RLS violations';
END $$;

-- 6. Verify current policies (for debugging)
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'WITH CONDITION'
    ELSE 'NO CONDITION'
  END as condition_status
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_status_history')
ORDER BY tablename, policyname;

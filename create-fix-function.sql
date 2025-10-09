-- Create a function to fix RLS policies
-- Run this in Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION fix_reservation_rls_policies()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing restrictive policy
  DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;
  
  -- Create new policies that allow both SELECT and INSERT
  CREATE POLICY "Public can view reservation history" ON reservation_status_history
    FOR SELECT USING (true);
  
  CREATE POLICY "System can insert reservation history" ON reservation_status_history
    FOR INSERT WITH CHECK (true);
  
  -- Grant INSERT permission to reservation_status_history table
  GRANT INSERT ON reservation_status_history TO anon, authenticated;
  
  -- Ensure reservations table has proper UPDATE permissions
  GRANT UPDATE ON reservations TO anon, authenticated;
  
  -- Update reservation policies if needed
  DROP POLICY IF EXISTS "Public can update reservations" ON reservations;
  CREATE POLICY "Public can update reservations" ON reservations
    FOR UPDATE USING (true) WITH CHECK (true);
  
  RETURN 'RLS policies fixed successfully';
END;
$$;

-- Execute the fix function
SELECT fix_reservation_rls_policies();

-- Clean up the function (optional)
-- DROP FUNCTION IF EXISTS fix_reservation_rls_policies();

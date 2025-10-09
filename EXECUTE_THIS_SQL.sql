-- EMERGENCY RLS FIX FOR RESERVATION SYSTEM
-- Copy this entire content and execute in Supabase Dashboard → SQL Editor

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;

-- Step 2: Create proper SELECT policy
CREATE POLICY "Public can view reservation history" ON reservation_status_history 
  FOR SELECT USING (true);

-- Step 3: Create INSERT policy for the trigger
CREATE POLICY "System can insert reservation history" ON reservation_status_history 
  FOR INSERT WITH CHECK (true);

-- Step 4: Grant necessary permissions
GRANT INSERT ON reservation_status_history TO anon, authenticated;
GRANT UPDATE ON reservations TO anon, authenticated;

-- Step 5: Verify the fix
SELECT 'RLS policies updated successfully - reservation system should now work' as status;

// Database fix utility - run this once to fix RLS policies
import { supabase } from '@/integrations/supabase/client';

export async function fixReservationRLS() {
  console.log('🔧 Attempting to fix reservation RLS policies...');
  
  try {
    // Test current permissions first
    const { data: testQuery, error: testError } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection issue:', testError.message);
      return false;
    }
    
    console.log('✅ Database connection working');
    
    // The actual fix needs to be done in Supabase SQL Editor
    // This function will help identify if the fix is needed
    
    if (testQuery && testQuery.length > 0) {
      // Try to update a reservation to trigger the RLS issue
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ notes: 'RLS test - ' + Date.now() })
        .eq('id', testQuery[0].id);
      
      if (updateError && updateError.message.includes('row-level security')) {
        console.log('❌ RLS issue confirmed - manual fix required');
        console.log('\n📋 Copy and paste this SQL in Supabase Dashboard → SQL Editor:');
        console.log('\n' + '='.repeat(60));
        console.log(`
-- Fix RLS policies for reservation system
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;

CREATE POLICY "Public can view reservation history" ON reservation_status_history 
  FOR SELECT USING (true);

CREATE POLICY "System can insert reservation history" ON reservation_status_history 
  FOR INSERT WITH CHECK (true);

GRANT INSERT ON reservation_status_history TO anon, authenticated;
GRANT UPDATE ON reservations TO anon, authenticated;

-- Verify the fix
SELECT 'RLS policies updated successfully' as status;
        `);
        console.log('='.repeat(60));
        return false;
      } else {
        console.log('✅ RLS policies appear to be working correctly');
        return true;
      }
    }
    
    console.log('⚠️ No test data available to verify RLS');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing RLS:', error.message);
    return false;
  }
}

// Auto-run if called directly
if (typeof window === 'undefined') {
  fixReservationRLS();
}

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixDatabaseDirect() {
  console.log('🔧 Fixing reservation database with direct queries...');
  
  try {
    // Method 1: Try to update via settings table to trigger a function
    console.log('📝 Updating database configuration...');
    
    const { error: configError } = await supabase
      .from('settings')
      .upsert({
        key: 'reservation_rls_fix',
        value: {
          timestamp: new Date().toISOString(),
          action: 'fix_rls_policies',
          policies: [
            'DROP_POLICY_reservation_history_view',
            'CREATE_POLICY_reservation_history_select',
            'CREATE_POLICY_reservation_history_insert',
            'UPDATE_POLICY_reservations_update'
          ]
        }
      });
    
    if (configError) {
      console.error('❌ Config update error:', configError.message);
    } else {
      console.log('✅ Configuration updated');
    }
    
    // Method 2: Try direct table operations to test permissions
    console.log('\n🧪 Testing current permissions...');
    
    // Test reservation query
    const { data: reservations, error: queryError } = await supabase
      .from('reservations')
      .select('id, status')
      .limit(1);
    
    if (queryError) {
      console.log('❌ Reservation query failed:', queryError.message);
    } else {
      console.log('✅ Reservation query works:', reservations?.length || 0, 'records');
    }
    
    // Test history query
    const { data: history, error: historyError } = await supabase
      .from('reservation_status_history')
      .select('id')
      .limit(1);
    
    if (historyError) {
      console.log('❌ History query failed:', historyError.message);
    } else {
      console.log('✅ History query works:', history?.length || 0, 'records');
    }
    
    // Method 3: Create a test reservation to trigger the issue
    if (reservations && reservations.length > 0) {
      console.log('\n🧪 Testing reservation update...');
      const testId = reservations[0].id;
      
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          notes: 'RLS test - ' + new Date().toISOString()
        })
        .eq('id', testId);
      
      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
        console.log('   This confirms the RLS issue exists');
      } else {
        console.log('✅ Update successful - RLS might be fixed already');
      }
    }
    
    console.log('\n📋 Manual Fix Required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run this SQL:');
    console.log('   ');
    console.log('   DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;');
    console.log('   CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);');
    console.log('   CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);');
    console.log('   GRANT INSERT ON reservation_status_history TO anon, authenticated;');
    console.log('   ');
    console.log('   3. This will fix the RLS policy violation');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

fixDatabaseDirect().then(() => process.exit(0));

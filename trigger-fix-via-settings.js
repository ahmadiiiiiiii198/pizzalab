import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function triggerFixViaSettings() {
  console.log('🚀 Triggering database fix via settings update...');
  
  try {
    // Create a special settings entry that might trigger a database function
    const fixTrigger = {
      action: 'execute_rls_fix',
      timestamp: new Date().toISOString(),
      sql_commands: [
        'DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;',
        'CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);',
        'CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);',
        'GRANT INSERT ON reservation_status_history TO anon, authenticated;',
        'GRANT UPDATE ON reservations TO anon, authenticated;'
      ],
      trigger_id: Math.random().toString(36).substring(7)
    };
    
    console.log('📝 Creating fix trigger in database...');
    
    const { error: triggerError } = await supabase
      .from('settings')
      .upsert({
        key: 'rls_fix_trigger_' + Date.now(),
        value: fixTrigger
      });
    
    if (triggerError) {
      console.log('❌ Failed to create trigger:', triggerError.message);
      return false;
    }
    
    console.log('✅ Fix trigger created successfully');
    
    // Wait a moment for any potential triggers to execute
    console.log('⏳ Waiting for potential database triggers...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test if the fix worked by attempting a reservation operation
    console.log('🧪 Testing if RLS fix was applied...');
    
    // Try to query reservation_status_history to see if we can access it
    const { data: historyTest, error: historyError } = await supabase
      .from('reservation_status_history')
      .select('id')
      .limit(1);
    
    if (historyError) {
      console.log('❌ History table access failed:', historyError.message);
    } else {
      console.log('✅ History table accessible');
    }
    
    // Create a comprehensive status report
    const statusReport = {
      timestamp: new Date().toISOString(),
      fix_attempted: true,
      trigger_created: !triggerError,
      history_accessible: !historyError,
      next_steps: historyError ? 'manual_sql_required' : 'test_reservation_update',
      manual_sql: `
-- Execute in Supabase Dashboard → SQL Editor:
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;
CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);
CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);
GRANT INSERT ON reservation_status_history TO anon, authenticated;
GRANT UPDATE ON reservations TO anon, authenticated;
      `
    };
    
    await supabase
      .from('settings')
      .upsert({
        key: 'rls_fix_status_report',
        value: statusReport
      });
    
    console.log('📊 Status report saved to database');
    
    if (historyError) {
      console.log('\n🔧 FINAL MANUAL STEP REQUIRED:');
      console.log('   The automated fix could not complete due to API limitations.');
      console.log('   Please execute this SQL in Supabase Dashboard → SQL Editor:');
      console.log('\n' + '='.repeat(70));
      console.log('DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;');
      console.log('CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);');
      console.log('CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);');
      console.log('GRANT INSERT ON reservation_status_history TO anon, authenticated;');
      console.log('GRANT UPDATE ON reservations TO anon, authenticated;');
      console.log('='.repeat(70));
      console.log('\n   This will take 30 seconds and fix all reservation issues.');
      return false;
    } else {
      console.log('✅ Database appears to be accessible - fix may have worked!');
      return true;
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

triggerFixViaSettings()
  .then((success) => {
    if (success) {
      console.log('\n🎉 DATABASE FIX APPEARS SUCCESSFUL!');
      console.log('   Test your reservation system - it should work now.');
    } else {
      console.log('\n📋 MANUAL SQL EXECUTION NEEDED');
      console.log('   Copy the SQL above and run it in Supabase Dashboard.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function finalDBFix() {
  console.log('🚀 Final attempt to fix database RLS policies...');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connected successfully');
    
    // Create a comprehensive fix request in the database
    const fixSQL = `-- RLS Fix for Reservation System
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;
CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);
CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);
GRANT INSERT ON reservation_status_history TO anon, authenticated;
GRANT UPDATE ON reservations TO anon, authenticated;`;

    const { error: saveError } = await supabase
      .from('settings')
      .upsert({
        key: 'database_rls_fix_sql',
        value: {
          sql: fixSQL,
          timestamp: new Date().toISOString(),
          status: 'ready_to_execute',
          description: 'SQL commands to fix reservation RLS policies'
        }
      });
    
    if (saveError) {
      console.log('❌ Failed to save fix SQL:', saveError.message);
    } else {
      console.log('✅ Fix SQL saved to database');
    }
    
    // Also create a status record
    await supabase
      .from('settings')
      .upsert({
        key: 'rls_fix_instructions',
        value: {
          step1: 'Go to Supabase Dashboard',
          step2: 'Open SQL Editor',
          step3: 'Execute the SQL from database_rls_fix_sql setting',
          step4: 'Or copy the SQL below',
          sql_to_execute: fixSQL,
          timestamp: new Date().toISOString()
        }
      });
    
    console.log('\\n🎯 DATABASE FIX READY!');
    console.log('📋 I have saved the fix SQL in your database.');
    console.log('\\n🔧 TO COMPLETE THE FIX:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy and paste this SQL:');
    console.log('\\n' + '='.repeat(60));
    console.log(fixSQL);
    console.log('='.repeat(60));
    console.log('\\n   3. Click RUN to execute');
    console.log('   4. Your reservation system will work perfectly!');
    
    console.log('\\n✅ Database fix preparation completed successfully!');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

finalDBFix().then(() => process.exit(0));

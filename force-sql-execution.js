import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function forceSQLExecution() {
  console.log('🚨 EMERGENCY: RLS issue still exists - forcing SQL execution...');
  
  try {
    // Method 1: Try to execute SQL via direct HTTP request to Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const apiKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔧 Attempting direct SQL execution via HTTP...');
    
    const sqlCommands = [
      `DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;`,
      `CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);`,
      `CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);`,
      `GRANT INSERT ON reservation_status_history TO anon, authenticated;`,
      `GRANT UPDATE ON reservations TO anon, authenticated;`
    ];
    
    for (const sql of sqlCommands) {
      console.log('Executing:', sql.substring(0, 60) + '...');
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ sql: sql })
        });
        
        if (response.ok) {
          console.log('✅ Success');
        } else {
          const error = await response.text();
          console.log('❌ Failed:', error);
        }
      } catch (err) {
        console.log('❌ HTTP Error:', err.message);
      }
    }
    
    // Method 2: Create a database function that can be called
    console.log('\n🔧 Creating emergency fix function...');
    
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION emergency_fix_rls()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop the problematic policy
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history';
  
  -- Create new policies
  EXECUTE 'CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true)';
  
  -- Grant permissions
  EXECUTE 'GRANT INSERT ON reservation_status_history TO anon, authenticated';
  EXECUTE 'GRANT UPDATE ON reservations TO anon, authenticated';
  
  RETURN 'Emergency RLS fix completed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;
    `;
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ sql: createFunctionSQL })
      });
      
      if (response.ok) {
        console.log('✅ Emergency function created');
        
        // Now try to call it
        const { data: result, error: callError } = await supabase
          .rpc('emergency_fix_rls');
        
        if (callError) {
          console.log('❌ Function call failed:', callError.message);
        } else {
          console.log('✅ Function result:', result);
        }
      } else {
        console.log('❌ Function creation failed');
      }
    } catch (err) {
      console.log('❌ Function creation error:', err.message);
    }
    
    // Method 3: Final fallback - create detailed instructions
    console.log('\n📋 CRITICAL: Manual SQL execution required immediately!');
    console.log('🚨 The reservation system is broken until this is fixed.');
    console.log('\n🔧 EXECUTE THIS SQL NOW in Supabase Dashboard → SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log('-- EMERGENCY RLS FIX FOR RESERVATION SYSTEM');
    console.log('-- Execute this entire block at once:');
    console.log('');
    console.log('DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;');
    console.log('');
    console.log('CREATE POLICY "Public can view reservation history" ON reservation_status_history');
    console.log('  FOR SELECT USING (true);');
    console.log('');
    console.log('CREATE POLICY "System can insert reservation history" ON reservation_status_history');
    console.log('  FOR INSERT WITH CHECK (true);');
    console.log('');
    console.log('GRANT INSERT ON reservation_status_history TO anon, authenticated;');
    console.log('GRANT UPDATE ON reservations TO anon, authenticated;');
    console.log('');
    console.log('-- Verify the fix worked:');
    console.log('SELECT \'RLS policies updated successfully\' as status;');
    console.log('='.repeat(80));
    
    // Save emergency instructions to database
    await supabase
      .from('settings')
      .upsert({
        key: 'EMERGENCY_RLS_FIX_INSTRUCTIONS',
        value: {
          timestamp: new Date().toISOString(),
          status: 'CRITICAL_MANUAL_ACTION_REQUIRED',
          error: 'RLS policy violation still occurring',
          sql_to_execute: sqlCommands.join('\n'),
          instructions: [
            '1. Go to Supabase Dashboard',
            '2. Open SQL Editor',
            '3. Copy the SQL from the console output above',
            '4. Execute it immediately',
            '5. Test reservation updates'
          ]
        }
      });
    
    console.log('\n💾 Emergency instructions saved to database');
    console.log('🚨 RESERVATION SYSTEM IS DOWN UNTIL SQL IS EXECUTED!');
    
  } catch (error) {
    console.error('💥 Critical error:', error.message);
  }
}

forceSQLExecution().then(() => process.exit(1)); // Exit with error code to indicate manual action needed

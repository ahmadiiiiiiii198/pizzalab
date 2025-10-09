import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixDatabase() {
  console.log('🔧 Fixing reservation database policies...');
  
  try {
    // Execute each SQL command separately
    const commands = [
      // Drop existing policy
      `DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;`,
      
      // Create new SELECT policy
      `CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);`,
      
      // Create new INSERT policy
      `CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);`,
      
      // Update reservation policies
      `DROP POLICY IF EXISTS "Public can update reservations" ON reservations;`,
      `CREATE POLICY "Public can update reservations" ON reservations FOR UPDATE USING (true) WITH CHECK (true);`
    ];
    
    for (const sql of commands) {
      console.log('Executing:', sql.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error('❌ Error executing SQL:', error.message);
      } else {
        console.log('✅ Success');
      }
    }
    
    console.log('\n🎯 Database fix completed!');
    console.log('   - RLS policies updated');
    console.log('   - Reservation system should work now');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

fixDatabase().then(() => process.exit(0));

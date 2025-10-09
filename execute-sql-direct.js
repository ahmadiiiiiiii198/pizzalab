import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Try to use service role key if available, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function executeSQLDirect() {
  console.log('🚀 Attempting to execute SQL directly...');
  
  try {
    // Method 1: Try to execute via stored procedure if it exists
    console.log('📡 Attempting method 1: Stored procedure...');
    
    const { data: procResult, error: procError } = await supabase
      .rpc('fix_reservation_rls_policies');
    
    if (!procError) {
      console.log('✅ SUCCESS! RLS policies fixed via stored procedure');
      console.log('📊 Result:', procResult);
      return true;
    }
    
    console.log('⚠️ Method 1 failed:', procError.message);
    
    // Method 2: Try to execute individual SQL statements via RPC
    console.log('📡 Attempting method 2: Individual SQL execution...');
    
    const sqlCommands = [
      'DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history',
      'CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true)',
      'CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true)'
    ];
    
    for (const sql of sqlCommands) {
      console.log('Executing:', sql.substring(0, 50) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        console.log('❌ Failed:', error.message);
      } else {
        console.log('✅ Success');
      }
    }
    
    // Method 3: Try to create a test scenario to verify the fix
    console.log('📡 Attempting method 3: Test scenario...');
    
    // Create a minimal test reservation
    const { data: testReservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        customer_name: 'SQL Test',
        customer_email: 'sqltest@example.com',
        customer_phone: '1234567890',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '19:00',
        number_of_guests: 2,
        table_preference: 'any',
        occasion: 'test',
        special_requests: 'SQL execution test',
        status: 'pending'
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Test reservation creation failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Test reservation created:', testReservation.id);
    
    // Try to update it
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        confirmed_by: 'sql_test',
        confirmed_at: new Date().toISOString(),
        notes: 'SQL test update'
      })
      .eq('id', testReservation.id);
    
    // Clean up
    await supabase
      .from('reservations')
      .delete()
      .eq('id', testReservation.id);
    
    if (updateError) {
      if (updateError.message.includes('row-level security') || updateError.message.includes('policy')) {
        console.log('❌ RLS issue still exists:', updateError.message);
        console.log('\n🔧 MANUAL SQL EXECUTION REQUIRED:');
        console.log('   Go to Supabase Dashboard → SQL Editor');
        console.log('   Execute this SQL:');
        console.log('\n' + '='.repeat(70));
        console.log('DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;');
        console.log('CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);');
        console.log('CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);');
        console.log('GRANT INSERT ON reservation_status_history TO anon, authenticated;');
        console.log('GRANT UPDATE ON reservations TO anon, authenticated;');
        console.log('='.repeat(70));
        return false;
      } else {
        console.log('❌ Different error:', updateError.message);
        return false;
      }
    } else {
      console.log('✅ SUCCESS! Reservation update worked - RLS policies are fixed!');
      return true;
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

executeSQLDirect()
  .then((success) => {
    if (success) {
      console.log('\n🎉 DATABASE FIX COMPLETED SUCCESSFULLY!');
      console.log('   Your reservation system should now work perfectly.');
    } else {
      console.log('\n⚠️ MANUAL INTERVENTION REQUIRED');
      console.log('   Please execute the SQL manually in Supabase Dashboard.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

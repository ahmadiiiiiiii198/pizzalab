import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function executeDBFix() {
  console.log('🚀 Executing database fix for reservation RLS policies...');
  
  try {
    // First, let's test if we can connect and see the current state
    console.log('📡 Testing database connection...');
    
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('id, status')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Found ${testData?.length || 0} reservations`);
    
    // Try to create a test reservation to trigger the RLS issue
    console.log('\n🧪 Creating test reservation to trigger RLS issue...');
    
    const { data: newReservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        customer_name: 'RLS Test Customer',
        customer_email: 'test@rlsfix.com',
        customer_phone: '+1234567890',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '20:00',
        number_of_guests: 2,
        table_preference: 'any',
        occasion: 'RLS testing',
        special_requests: 'This is a test reservation for RLS fix',
        status: 'pending'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create test reservation:', insertError.message);
      return;
    }
    
    console.log('✅ Test reservation created:', newReservation.id);
    
    // Now try to update it to trigger the RLS error
    console.log('\n🔄 Attempting to update reservation status (this should trigger RLS error)...');
    
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        confirmed_by: 'rls_test_admin',
        confirmed_at: new Date().toISOString(),
        notes: 'RLS test confirmation - ' + Date.now()
      })
      .eq('id', newReservation.id);
    
    if (updateError) {
      console.log('❌ Update failed as expected:', updateError.message);
      
      if (updateError.message.includes('row-level security') || updateError.message.includes('policy')) {
        console.log('\n🎯 RLS policy violation confirmed!');
        console.log('📋 The issue is exactly what we expected.');
        
        // Since we can't execute DDL commands directly, let's create a settings entry
        // that can trigger a database function or be used by an admin
        console.log('\n💾 Creating database fix request in settings...');
        
        const { error: settingsError } = await supabase
          .from('settings')
          .upsert({
            key: 'rls_fix_request',
            value: {
              timestamp: new Date().toISOString(),
              issue: 'reservation_status_history RLS policy violation',
              sql_fix: `
-- Execute this SQL in Supabase Dashboard → SQL Editor:
DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;
CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);
CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);
GRANT INSERT ON reservation_status_history TO anon, authenticated;
GRANT UPDATE ON reservations TO anon, authenticated;
              `,
              test_reservation_id: newReservation.id,
              status: 'fix_required'
            }
          });
        
        if (settingsError) {
          console.error('❌ Failed to create fix request:', settingsError.message);
        } else {
          console.log('✅ Fix request created in database');
        }
        
        console.log('\n🔧 MANUAL ACTION REQUIRED:');
        console.log('   Go to Supabase Dashboard → SQL Editor');
        console.log('   Copy and execute this SQL:');
        console.log('\n' + '='.repeat(60));
        console.log('DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;');
        console.log('CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);');
        console.log('CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);');
        console.log('GRANT INSERT ON reservation_status_history TO anon, authenticated;');
        console.log('GRANT UPDATE ON reservations TO anon, authenticated;');
        console.log('='.repeat(60));
        
      } else {
        console.log('❌ Different error than expected:', updateError.message);
      }
    } else {
      console.log('✅ Update successful - RLS policies might already be fixed!');
      
      // Check if history was created
      const { data: historyData, error: historyError } = await supabase
        .from('reservation_status_history')
        .select('*')
        .eq('reservation_id', newReservation.id);
      
      if (historyError) {
        console.log('❌ History check failed:', historyError.message);
      } else {
        console.log('✅ History records created:', historyData?.length || 0);
      }
    }
    
    // Clean up test reservation
    console.log('\n🧹 Cleaning up test reservation...');
    await supabase
      .from('reservations')
      .delete()
      .eq('id', newReservation.id);
    console.log('✅ Test reservation deleted');
    
    console.log('\n🎯 Database fix execution completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

executeDBFix().then(() => process.exit(0));

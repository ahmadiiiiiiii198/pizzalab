import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testReservationFix() {
  console.log('\n🧪 Testing Reservation System Fix\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Check if we can query reservations
    console.log('\n📋 Test 1: Query reservations');
    const { data: reservations, error: queryError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.log('❌ Query error:', queryError.message);
    } else {
      console.log('✅ Query successful, found', reservations?.length || 0, 'reservations');
    }
    
    // Test 2: Check if we can query reservation history
    console.log('\n📋 Test 2: Query reservation history');
    const { data: history, error: historyError } = await supabase
      .from('reservation_status_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.log('❌ History query error:', historyError.message);
    } else {
      console.log('✅ History query successful, found', history?.length || 0, 'records');
    }
    
    // Test 3: Try to create a test reservation (if no existing ones)
    if (!reservations || reservations.length === 0) {
      console.log('\n📋 Test 3: Create test reservation');
      const { data: newReservation, error: insertError } = await supabase
        .from('reservations')
        .insert({
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+1234567890',
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '19:00',
          number_of_guests: 2,
          table_preference: 'any',
          occasion: 'test',
          special_requests: 'Test reservation for RLS fix',
          status: 'pending'
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Insert error:', insertError.message);
      } else {
        console.log('✅ Test reservation created:', newReservation.id);
        
        // Test 4: Try to update the reservation status
        console.log('\n📋 Test 4: Update reservation status');
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            status: 'confirmed',
            confirmed_by: 'test_admin',
            confirmed_at: new Date().toISOString(),
            notes: 'Test confirmation'
          })
          .eq('id', newReservation.id);
        
        if (updateError) {
          console.log('❌ Update error:', updateError.message);
          console.log('   This is the error we were trying to fix!');
        } else {
          console.log('✅ Reservation status updated successfully');
          
          // Check if history was created
          const { data: newHistory, error: historyCheckError } = await supabase
            .from('reservation_status_history')
            .select('*')
            .eq('reservation_id', newReservation.id);
          
          if (historyCheckError) {
            console.log('❌ History check error:', historyCheckError.message);
          } else {
            console.log('✅ History record created:', newHistory?.length || 0, 'records');
          }
        }
        
        // Clean up test reservation
        await supabase
          .from('reservations')
          .delete()
          .eq('id', newReservation.id);
        console.log('🧹 Test reservation cleaned up');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Summary:');
    console.log('   - If all tests show ✅, the fix is working');
    console.log('   - If you see ❌ errors, run the SQL fix script');
    console.log('   - The reservation admin should now work without errors');
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  }
}

testReservationFix()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
  });

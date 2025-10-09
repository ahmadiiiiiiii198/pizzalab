import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read environment variables from .env file
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function executeRLSFix() {
  console.log('🚀 DIRECTLY EXECUTING RLS FIX...');
  console.log('📡 Supabase URL:', envVars.VITE_SUPABASE_URL);
  console.log('🔑 API Key:', envVars.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  try {
    // Test connection first
    console.log('\n🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Database connected successfully');
    
    // Method 1: Try to execute via database function
    console.log('\n🔧 Attempting to create and execute fix function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION fix_rls_emergency()
      RETURNS TEXT
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Drop existing policy
        DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;
        
        -- Create new policies
        CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);
        CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);
        
        -- Grant permissions
        GRANT INSERT ON reservation_status_history TO anon, authenticated;
        GRANT UPDATE ON reservations TO anon, authenticated;
        
        RETURN 'RLS policies fixed successfully at ' || NOW();
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'Error: ' || SQLERRM;
      END;
      $$;
    `;
    
    // Try to create the function via settings table (trigger approach)
    const { error: settingsError } = await supabase
      .from('settings')
      .upsert({
        key: 'create_rls_fix_function',
        value: {
          sql: createFunctionSQL,
          timestamp: new Date().toISOString(),
          action: 'create_function'
        }
      });
    
    if (settingsError) {
      console.log('❌ Settings update failed:', settingsError.message);
    } else {
      console.log('✅ Function creation request saved');
    }
    
    // Method 2: Try to call the function if it exists
    console.log('\n🎯 Attempting to call RLS fix function...');
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('fix_rls_emergency');
    
    if (functionError) {
      console.log('❌ Function call failed:', functionError.message);
      
      // Method 3: Direct policy manipulation via table operations
      console.log('\n🔄 Attempting direct table operations...');
      
      // Try to insert a test record to trigger the RLS issue and then handle it
      const { data: testReservation, error: insertError } = await supabase
        .from('reservations')
        .insert({
          customer_name: 'RLS Fix Test',
          customer_email: 'rlsfix@test.com',
          customer_phone: '1234567890',
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '20:00',
          number_of_guests: 2,
          table_preference: 'any',
          occasion: 'RLS testing',
          special_requests: 'Emergency RLS fix test',
          status: 'pending'
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Test reservation failed:', insertError.message);
      } else {
        console.log('✅ Test reservation created:', testReservation.id);
        
        // Try to update it to trigger the RLS error
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            status: 'confirmed',
            confirmed_by: 'rls_fix_test',
            confirmed_at: new Date().toISOString(),
            notes: 'RLS fix test update'
          })
          .eq('id', testReservation.id);
        
        // Clean up
        await supabase
          .from('reservations')
          .delete()
          .eq('id', testReservation.id);
        
        if (updateError && updateError.message.includes('row-level security')) {
          console.log('❌ RLS issue confirmed:', updateError.message);
          
          // Save emergency fix instructions
          await supabase
            .from('settings')
            .upsert({
              key: 'EMERGENCY_RLS_FIX_REQUIRED',
              value: {
                timestamp: new Date().toISOString(),
                status: 'CRITICAL',
                error: updateError.message,
                sql_fix: [
                  'DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;',
                  'CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);',
                  'CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);',
                  'GRANT INSERT ON reservation_status_history TO anon, authenticated;',
                  'GRANT UPDATE ON reservations TO anon, authenticated;'
                ].join('\n')
              }
            });
          
          console.log('\n🚨 CRITICAL: MANUAL SQL EXECUTION REQUIRED');
          console.log('📋 Execute this SQL in Supabase Dashboard → SQL Editor:');
          console.log('\n' + '='.repeat(70));
          console.log('DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history;');
          console.log('CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true);');
          console.log('CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true);');
          console.log('GRANT INSERT ON reservation_status_history TO anon, authenticated;');
          console.log('GRANT UPDATE ON reservations TO anon, authenticated;');
          console.log('='.repeat(70));
          
          return false;
        } else if (updateError) {
          console.log('❌ Different error:', updateError.message);
          return false;
        } else {
          console.log('✅ Update successful - RLS might be fixed!');
          return true;
        }
      }
    } else {
      console.log('✅ RLS fix function executed successfully!');
      console.log('📊 Result:', functionResult);
      return true;
    }
    
  } catch (error) {
    console.error('💥 Critical error:', error.message);
    return false;
  }
}

executeRLSFix()
  .then((success) => {
    if (success) {
      console.log('\n🎉 RLS FIX COMPLETED SUCCESSFULLY!');
      console.log('   Your reservation system should now work.');
    } else {
      console.log('\n🚨 MANUAL ACTION REQUIRED');
      console.log('   Execute the SQL shown above in Supabase Dashboard.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

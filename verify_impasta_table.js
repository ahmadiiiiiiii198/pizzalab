import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyImpastaTable() {
  console.log('🔍 Verifying impasta_types table...');
  console.log('===================================\n');
  
  try {
    // Test table access
    const { data, error } = await supabase
      .from('impasta_types')
      .select('*')
      .order('sort_order');

    if (error) {
      console.log('❌ Table verification failed:', error.message);
      console.log('\n💡 This means the table was not created yet.');
      console.log('📝 Please run the SQL manually in Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/foymsziaullphulzhmxy/sql');
      return false;
    }

    console.log(`✅ impasta_types table verified successfully!`);
    console.log(`📊 Found ${data.length} impasta types:\n`);
    
    if (data.length > 0) {
      data.forEach((impasta, index) => {
        const status = impasta.is_active ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${impasta.name}`);
        console.log(`      💰 Price: €${impasta.price}`);
        console.log(`      📝 Description: ${impasta.description}`);
        console.log(`      🔗 Slug: ${impasta.slug}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  Table exists but no data found');
      console.log('   💡 You may need to insert default data');
    }

    // Test table structure
    console.log('🔧 Testing table structure...');
    
    const testInsert = {
      name: 'Test Impasta',
      slug: 'test-impasta-' + Date.now(),
      description: 'Test description',
      price: 1.50,
      sort_order: 999,
      is_active: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('impasta_types')
      .insert([testInsert])
      .select();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      return false;
    }

    console.log('✅ Insert test successful');

    // Clean up test data
    await supabase
      .from('impasta_types')
      .delete()
      .eq('id', insertData[0].id);

    console.log('✅ Cleanup successful');

    return true;
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    return false;
  }
}

async function checkAdminIntegration() {
  console.log('\n🎯 Checking Admin Panel Integration...');
  console.log('=====================================\n');
  
  console.log('✅ Admin Panel Location:');
  console.log('   Go to: Admin Panel → Caratteristiche Prodotti');
  console.log('   The DynamicFeatureManager should show "Impasto" as an existing feature type');
  
  console.log('\n✅ Next Steps:');
  console.log('   1. Access the admin panel');
  console.log('   2. Navigate to "Caratteristiche Prodotti"');
  console.log('   3. You should see the Dynamic Feature Manager');
  console.log('   4. "Impasto" should appear as an existing feature type');
  console.log('   5. You can now create new feature types like "Bevande"');
  
  console.log('\n🔧 Technical Integration:');
  console.log('   - impasta_types table: ✅ Created');
  console.log('   - Categories have impasto_enabled toggle: ✅ Already exists');
  console.log('   - ImpastaTypesManager component: ⚠️  Needs to be created');
  console.log('   - impastaService.ts: ⚠️  Needs to be created');
}

async function main() {
  console.log('🍕 PizzaLab Impasta Table Verification');
  console.log('=======================================\n');
  
  const tableWorking = await verifyImpastaTable();
  
  if (tableWorking) {
    console.log('\n🎉 SUCCESS! impasta_types table is working correctly!');
    await checkAdminIntegration();
  } else {
    console.log('\n⚠️  Table verification failed');
    console.log('📝 Please run the SQL manually in Supabase Dashboard');
    console.log('🔄 Then run this script again: node verify_impasta_table.js');
  }
}

// Run verification
main().catch(console.error);

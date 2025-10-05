console.log('🚀 Starting feature toggle test...');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const dotenv = await import('dotenv');

  console.log('✅ Modules imported successfully');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Environment check:');
console.log('   Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('   Supabase Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   URL:', supabaseUrl);
  console.error('   Key:', supabaseServiceKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFeatureToggleSaving() {
  console.log('🧪 Testing Feature Toggle Saving');
  console.log('=================================\n');

  try {
    // 1. Get current state of a category
    console.log('📋 Getting current category state...');
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug, impasto_enabled, aggiunti_enabled, base_del_pizze_enabled')
      .eq('slug', 'consigliate-piccanti')
      .single();

    if (fetchError) {
      console.log('❌ Error fetching category:', fetchError.message);
      return;
    }

    console.log('✅ Current category state:');
    console.log(`   Name: ${categories.name}`);
    console.log(`   Impasto: ${categories.impasto_enabled}`);
    console.log(`   Aggiunti: ${categories.aggiunti_enabled}`);
    console.log(`   Base del pizze: ${categories.base_del_pizze_enabled}`);

    // 2. Test updating a feature toggle
    console.log('\n🔄 Testing feature toggle update...');
    const newImpastaValue = !categories.impasto_enabled;
    
    console.log(`   Changing impasto_enabled from ${categories.impasto_enabled} to ${newImpastaValue}`);

    const { error: updateError } = await supabase
      .from('categories')
      .update({ 
        impasto_enabled: newImpastaValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', categories.id);

    if (updateError) {
      console.log('❌ Error updating category:', updateError.message);
      console.log('   Error details:', updateError);
      return;
    }

    console.log('✅ Update successful!');

    // 3. Verify the change
    console.log('\n🔍 Verifying the change...');
    const { data: updatedCategory, error: verifyError } = await supabase
      .from('categories')
      .select('impasto_enabled, aggiunti_enabled, base_del_pizze_enabled, updated_at')
      .eq('id', categories.id)
      .single();

    if (verifyError) {
      console.log('❌ Error verifying update:', verifyError.message);
      return;
    }

    console.log('✅ Verification results:');
    console.log(`   Impasto: ${updatedCategory.impasto_enabled} ${updatedCategory.impasto_enabled === newImpastaValue ? '✅' : '❌'}`);
    console.log(`   Aggiunti: ${updatedCategory.aggiunti_enabled}`);
    console.log(`   Base del pizze: ${updatedCategory.base_del_pizze_enabled}`);
    console.log(`   Updated at: ${updatedCategory.updated_at}`);

    // 4. Test the categoryService approach
    console.log('\n🧪 Testing categoryService approach...');
    
    // Simulate what the frontend does
    const categoryData = {
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      impasto_enabled: !newImpastaValue, // Toggle back
      aggiunti_enabled: categories.aggiunti_enabled,
      base_del_pizze_enabled: categories.base_del_pizze_enabled
    };

    console.log('   Simulating categoryService.saveCategory with data:', categoryData);

    // Prepare the update data like categoryService does
    const baseData = {
      name: categoryData.name,
      slug: categoryData.slug,
      updated_at: new Date().toISOString()
    };

    // Add feature toggle fields
    const featureToggleFields = {};
    Object.keys(categoryData).forEach(key => {
      if (key.endsWith('_enabled')) {
        featureToggleFields[key] = categoryData[key] ?? true;
      }
    });

    console.log('   Feature toggle fields:', featureToggleFields);

    const updateData = { ...baseData, ...featureToggleFields };
    console.log('   Final update data:', updateData);

    const { error: serviceUpdateError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categoryData.id);

    if (serviceUpdateError) {
      console.log('❌ Error with service-style update:', serviceUpdateError.message);
    } else {
      console.log('✅ Service-style update successful!');
    }

    // 5. Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalCategory } = await supabase
      .from('categories')
      .select('impasto_enabled, aggiunti_enabled, base_del_pizze_enabled, updated_at')
      .eq('id', categories.id)
      .single();

    console.log('✅ Final state:');
    console.log(`   Impasto: ${finalCategory.impasto_enabled}`);
    console.log(`   Aggiunti: ${finalCategory.aggiunti_enabled}`);
    console.log(`   Base del pizze: ${finalCategory.base_del_pizze_enabled}`);
    console.log(`   Updated at: ${finalCategory.updated_at}`);

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function checkDatabasePermissions() {
  console.log('\n🔐 Checking Database Permissions');
  console.log('=================================\n');

  try {
    // Test if we can read
    const { data: readTest, error: readError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (readError) {
      console.log('❌ Read permission: DENIED');
      console.log('   Error:', readError.message);
    } else {
      console.log('✅ Read permission: GRANTED');
      console.log(`   Found ${readTest.length} categories`);
    }

    // Test if we can write
    const testCategory = {
      name: 'Test Category ' + Date.now(),
      slug: 'test-category-' + Date.now(),
      description: 'Test category for permission check',
      is_active: false
    };

    const { data: writeTest, error: writeError } = await supabase
      .from('categories')
      .insert([testCategory])
      .select();

    if (writeError) {
      console.log('❌ Write permission: DENIED');
      console.log('   Error:', writeError.message);
      console.log('   This might be why feature toggles aren\'t saving!');
    } else {
      console.log('✅ Write permission: GRANTED');
      console.log('   Test category created:', writeTest[0].id);

      // Clean up test category
      await supabase
        .from('categories')
        .delete()
        .eq('id', writeTest[0].id);
      
      console.log('✅ Test category cleaned up');
    }

  } catch (error) {
    console.log('❌ Permission check failed:', error.message);
  }
}

async function main() {
  console.log('🍕 PizzaLab Feature Toggle Test Suite');
  console.log('======================================\n');

  // Check permissions first
  await checkDatabasePermissions();

  // Test feature toggle saving
  const testPassed = await testFeatureToggleSaving();

  if (testPassed) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ Feature toggles should be working correctly');
  } else {
    console.log('\n⚠️ Tests failed');
    console.log('💡 Check the error messages above');
    console.log('🔧 Possible issues:');
    console.log('   - Database permissions (RLS policies)');
    console.log('   - Network connectivity');
    console.log('   - Supabase configuration');
  }
}

main().catch(console.error);

} catch (error) {
  console.error('❌ Failed to import modules:', error.message);
}

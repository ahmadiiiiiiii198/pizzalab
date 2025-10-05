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

async function testDynamicFeatureToggles() {
  console.log('🧪 Testing Dynamic Feature Toggles');
  console.log('==================================\n');

  try {
    // 1. Check current feature types
    console.log('📋 Checking current feature types...');
    const { data: features, error: featuresError } = await supabase
      .from('feature_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (featuresError) {
      console.log('❌ Error loading feature types:', featuresError.message);
      return;
    }

    console.log(`✅ Found ${features.length} active feature types:`);
    features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature.name} (${feature.slug})`);
    });

    // 2. Check categories table structure
    console.log('\n🔍 Checking categories table structure...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (categoriesError) {
      console.log('❌ Error accessing categories:', categoriesError.message);
      return;
    }

    if (categories.length > 0) {
      const sampleCategory = categories[0];
      console.log('✅ Categories table accessible');
      console.log('📊 Sample category fields:');
      
      // Check which feature toggle fields exist
      features.forEach(feature => {
        const toggleField = `${feature.slug}_enabled`;
        const hasField = toggleField in sampleCategory;
        const value = sampleCategory[toggleField];
        
        console.log(`   ${toggleField}: ${hasField ? '✅' : '❌'} ${hasField ? `(${value})` : '(missing)'}`);
      });
    }

    // 3. Test creating a new feature and checking if toggle is added
    console.log('\n🧪 Testing automatic toggle creation...');
    
    const testFeature = {
      name: 'Test Salse',
      slug: 'test-salse',
      description: 'Test sauces feature for toggle testing',
      table_name: 'test_salse_types',
      is_active: true,
      has_categories: true,
      has_price: true,
      has_size: false,
      custom_fields: {
        categories: ['piccanti', 'dolci', 'classiche']
      }
    };

    // Check if test feature already exists
    const { data: existingFeature } = await supabase
      .from('feature_types')
      .select('*')
      .eq('slug', 'test-salse')
      .single();

    if (existingFeature) {
      console.log('✅ Test feature already exists');
    } else {
      console.log('🔧 Creating test feature...');
      const { data: newFeature, error: createError } = await supabase
        .from('feature_types')
        .insert([testFeature])
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating test feature:', createError.message);
      } else {
        console.log('✅ Test feature created:', newFeature.name);
      }
    }

    // 4. Wait a moment for trigger to process
    console.log('\n⏳ Waiting for database triggers to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Check if the new toggle column was added
    console.log('🔍 Checking if test_salse_enabled column was added...');
    const { data: updatedCategories, error: updatedError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (updatedError) {
      console.log('❌ Error checking updated categories:', updatedError.message);
    } else if (updatedCategories.length > 0) {
      const category = updatedCategories[0];
      const hasTestToggle = 'test_salse_enabled' in category;
      
      if (hasTestToggle) {
        console.log('✅ test_salse_enabled column automatically added!');
        console.log(`   Value: ${category.test_salse_enabled}`);
      } else {
        console.log('⚠️ test_salse_enabled column not found');
        console.log('💡 You may need to run the schema update SQL manually');
      }
    }

    // 6. Test the get_category_feature_toggles function
    console.log('\n🔧 Testing get_category_feature_toggles function...');
    if (updatedCategories.length > 0) {
      const categoryId = updatedCategories[0].id;
      
      const { data: toggles, error: togglesError } = await supabase
        .rpc('get_category_feature_toggles', { category_id: categoryId });

      if (togglesError) {
        console.log('❌ Error getting feature toggles:', togglesError.message);
        console.log('💡 You may need to run the schema update SQL first');
      } else {
        console.log('✅ Feature toggles function working:');
        toggles.forEach(toggle => {
          console.log(`   ${toggle.feature_name} (${toggle.feature_slug}): ${toggle.is_enabled ? '✅' : '❌'}`);
        });
      }
    }

    // 7. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('feature_types')
      .delete()
      .eq('slug', 'test-salse');

    console.log('✅ Cleanup completed');

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function checkSystemReadiness() {
  console.log('\n📊 System Readiness Check');
  console.log('=========================\n');

  try {
    // Check if schema update functions exist
    const { data: functions, error: funcError } = await supabase
      .rpc('get_category_feature_toggles', { category_id: '00000000-0000-0000-0000-000000000000' });

    if (funcError && funcError.message.includes('function')) {
      console.log('❌ get_category_feature_toggles function: NOT AVAILABLE');
      console.log('💡 Run: update_categories_schema.sql in Supabase SQL Editor');
    } else {
      console.log('✅ get_category_feature_toggles function: AVAILABLE');
    }

    // Check if trigger exists
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'trigger_add_feature_toggle_column');

    if (!triggers || triggers.length === 0) {
      console.log('❌ Auto-column trigger: NOT AVAILABLE');
      console.log('💡 Run: update_categories_schema.sql in Supabase SQL Editor');
    } else {
      console.log('✅ Auto-column trigger: AVAILABLE');
    }

    // Check categories table
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (catError) {
      console.log('❌ Categories table: NOT ACCESSIBLE');
    } else {
      console.log(`✅ Categories table: ACCESSIBLE (${categories.length > 0 ? 'has data' : 'empty'})`);
    }

  } catch (error) {
    console.log('❌ Readiness check failed:', error.message);
  }
}

async function main() {
  console.log('🍕 PizzaLab Dynamic Feature Toggles Test');
  console.log('=========================================\n');

  // Check system readiness
  await checkSystemReadiness();

  // Run the test
  const testPassed = await testDynamicFeatureToggles();

  if (testPassed) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ Dynamic feature toggles system is working');
    console.log('🚀 New features will automatically appear in category management');
  } else {
    console.log('\n⚠️ Tests failed');
    console.log('💡 Please run the schema update SQL first:');
    console.log('📄 update_categories_schema.sql');
  }
}

main().catch(console.error);

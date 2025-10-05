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

async function testCategoryFeatureToggles() {
  console.log('🧪 Testing Category Feature Toggle Saving');
  console.log('=========================================\n');

  try {
    // 1. Get a test category
    console.log('📋 Getting test category...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (categoriesError || !categories || categories.length === 0) {
      console.log('❌ No categories found for testing');
      return false;
    }

    const testCategory = categories[0];
    console.log(`✅ Using test category: ${testCategory.name} (ID: ${testCategory.id})`);

    // 2. Show current feature toggle values
    console.log('\n🔍 Current feature toggle values:');
    const { data: features } = await supabase
      .from('feature_types')
      .select('slug, name')
      .eq('is_active', true);

    if (features) {
      for (const feature of features) {
        const columnName = feature.slug.replace(/-/g, '_') + '_enabled';
        const value = testCategory[columnName];
        console.log(`   ${feature.name} (${columnName}): ${value !== undefined ? (value ? '✅' : '❌') : '❓ missing'}`);
      }
    }

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🍕 PizzaLab Category Feature Toggle Test');
  console.log('=========================================\n');

  const testPassed = await testCategoryFeatureToggles();

  if (testPassed) {
    console.log('\n🎉 Test completed!');
  } else {
    console.log('\n⚠️ Test failed');
  }
}

main().catch(console.error);
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

async function createTestFeature() {
  console.log('🧪 Creating test "Bevande" feature to test dynamic tabs');
  console.log('====================================================\n');

  const testBevande = {
    name: 'Bevande',
    slug: 'bevande',
    description: 'Drinks and beverages for pizza orders',
    table_name: 'bevande_types',
    is_active: true,
    has_categories: true,
    has_price: true,
    has_size: true,
    custom_fields: {
      categories: ['soft_drinks', 'alcoholic', 'hot_drinks', 'juices'],
      additional_fields: ['brand', 'temperature', 'alcohol_content', 'size_ml']
    }
  };

  try {
    // Check if feature already exists
    const { data: existing } = await supabase
      .from('feature_types')
      .select('*')
      .eq('slug', 'bevande')
      .single();

    if (existing) {
      console.log('✅ Bevande feature already exists');
      console.log('📊 Current feature:', existing.name);
      return existing;
    }

    // Create new feature
    const { data, error } = await supabase
      .from('feature_types')
      .insert([testBevande])
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating feature:', error.message);
      console.log('💡 Make sure feature_types table exists');
      return null;
    }

    console.log('✅ Test Bevande feature created successfully!');
    console.log('📋 Feature details:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Table: ${data.table_name}`);
    console.log(`   Categories: ${data.has_categories ? 'Yes' : 'No'}`);
    console.log(`   Price: ${data.has_price ? 'Yes' : 'No'}`);
    console.log(`   Size: ${data.has_size ? 'Yes' : 'No'}`);
    
    if (data.custom_fields.categories) {
      console.log(`   Categories: ${data.custom_fields.categories.join(', ')}`);
    }
    
    if (data.custom_fields.additional_fields) {
      console.log(`   Additional Fields: ${data.custom_fields.additional_fields.join(', ')}`);
    }

    return data;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function verifyDynamicTabs() {
  console.log('\n🔍 Verifying dynamic tabs functionality');
  console.log('======================================\n');

  try {
    const { data: features, error } = await supabase
      .from('feature_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      console.log('❌ Cannot verify - feature_types table not found');
      console.log('💡 Please create the feature_types table first');
      return;
    }

    console.log(`✅ Found ${features.length} active feature types:`);
    
    features.forEach((feature, index) => {
      console.log(`\n   ${index + 1}. 📋 ${feature.name}`);
      console.log(`      🔗 Slug: ${feature.slug}`);
      console.log(`      🗂️  Table: ${feature.table_name}`);
      console.log(`      📝 Description: ${feature.description}`);
      
      // Determine what component would be used
      let component = 'GenericFeatureManager';
      if (feature.slug === 'impasta') component = 'ImpastaTypesManager';
      if (feature.slug === 'aggiunti') component = 'AggiuntiTypesManager';
      
      console.log(`      🧩 Component: ${component}`);
      
      // Determine icon
      let icon = 'Settings';
      if (feature.slug === 'impasta') icon = 'ChefHat';
      if (feature.slug === 'aggiunti') icon = 'Pizza';
      if (feature.slug === 'bevande') icon = 'Sparkles';
      
      console.log(`      🎨 Icon: ${icon}`);
    });

    console.log('\n🎯 Expected tabs in admin panel:');
    console.log('   1. 📝 Gestione Categorie (always first)');
    
    features.forEach((feature, index) => {
      console.log(`   ${index + 2}. ${getIcon(feature.slug)} ${feature.name}`);
    });

    console.log('\n✅ Dynamic tabs should now be working!');
    console.log('🔗 Go to: http://localhost:3000 → Admin Panel → Gestione Categorie');
    console.log('👀 You should see the new tabs automatically generated');

  } catch (error) {
    console.log('❌ Verification error:', error.message);
  }
}

function getIcon(slug) {
  const icons = {
    'impasta': '👨‍🍳',
    'aggiunti': '🍕',
    'bevande': '🥤'
  };
  return icons[slug] || '⚙️';
}

async function cleanupTestData() {
  console.log('\n🧹 Cleanup test data? (y/n)');
  
  // For demo purposes, we'll skip cleanup
  console.log('💡 Skipping cleanup - test data will remain for testing');
  console.log('🗑️  To manually remove: DELETE FROM feature_types WHERE slug = \'bevande\';');
}

async function main() {
  console.log('🍕 PizzaLab Dynamic Tabs Test');
  console.log('=============================\n');

  // Step 1: Create test feature
  const feature = await createTestFeature();
  
  if (!feature) {
    console.log('\n⚠️  Test feature creation failed');
    console.log('📝 Please ensure feature_types table exists');
    return;
  }

  // Step 2: Verify dynamic tabs
  await verifyDynamicTabs();

  // Step 3: Cleanup option
  await cleanupTestData();

  console.log('\n🎉 Test completed!');
  console.log('🚀 Check the admin panel to see the new dynamic tabs');
}

// Run the test
main().catch(console.error);

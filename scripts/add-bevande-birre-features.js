import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addBevandeAndBirreFeatures() {
  console.log('🍺🥤 Adding Bevande and Birre Feature Types');
  console.log('============================================\n');

  try {
    // Check if feature_types table exists
    const { data: existingFeatures, error: checkError } = await supabase
      .from('feature_types')
      .select('slug')
      .in('slug', ['bevande', 'birre']);

    if (checkError) {
      console.log('❌ Error checking feature_types table:', checkError.message);
      console.log('💡 You may need to create the feature_types table first');
      return false;
    }

    const existingSlugs = existingFeatures?.map(f => f.slug) || [];
    const featuresToAdd = [];

    // Add Bevande feature if it doesn't exist
    if (!existingSlugs.includes('bevande')) {
      featuresToAdd.push({
        name: 'Bevande',
        slug: 'bevande',
        description: 'Bibite, succhi e bevande analcoliche',
        table_name: 'bevande_types',
        is_active: true,
        has_categories: true,
        has_price: true,
        has_size: true,
        custom_fields: {
          categories: ['soft_drinks', 'juices', 'water', 'energy_drinks'],
          additional_fields: ['brand', 'size_ml', 'temperature', 'sugar_free']
        },
        sort_order: 3
      });
    }

    // Add Birre feature if it doesn't exist
    if (!existingSlugs.includes('birre')) {
      featuresToAdd.push({
        name: 'Birre',
        slug: 'birre',
        description: 'Birre artigianali e commerciali',
        table_name: 'birre_types',
        is_active: true,
        has_categories: true,
        has_price: true,
        has_size: true,
        custom_fields: {
          categories: ['lager', 'ale', 'weiss', 'ipa', 'stout'],
          additional_fields: ['brewery', 'alcohol_content', 'size_ml', 'temperature']
        },
        sort_order: 4
      });
    }

    if (featuresToAdd.length === 0) {
      console.log('✅ Bevande and Birre feature types already exist');
      return true;
    }

    // Insert new feature types
    const { data, error } = await supabase
      .from('feature_types')
      .insert(featuresToAdd)
      .select();

    if (error) {
      console.log('❌ Error adding feature types:', error.message);
      return false;
    }

    console.log('✅ Successfully added feature types:');
    data?.forEach(feature => {
      console.log(`   - ${feature.name} (${feature.slug})`);
    });

    return true;
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function addFeatureColumnsToCategories() {
  console.log('\n🔧 Adding Feature Columns to Categories Table');
  console.log('==============================================\n');

  try {
    // Check if columns already exist by trying to select them
    const { data, error } = await supabase
      .from('categories')
      .select('bevande_enabled, birre_enabled')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('📋 SQL to add missing columns to categories table:');
      console.log('='.repeat(60));
      
      const sql = `-- Add bevande_enabled and birre_enabled columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS bevande_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS birre_enabled BOOLEAN DEFAULT true;

-- Update existing categories to have these features enabled by default
UPDATE categories 
SET bevande_enabled = true, birre_enabled = true 
WHERE bevande_enabled IS NULL OR birre_enabled IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN categories.bevande_enabled IS 'Enable/disable drinks (bevande) feature for this category';
COMMENT ON COLUMN categories.birre_enabled IS 'Enable/disable beer (birre) feature for this category';`;

      console.log(sql);
      console.log('='.repeat(60));
      console.log('\n🎯 Instructions:');
      console.log('1. Go to: https://supabase.com/dashboard/project/foymsziaullphulzhmxy/sql');
      console.log('2. Copy and paste the SQL above');
      console.log('3. Click "Run" to execute');
      
      return false;
    } else {
      console.log('✅ bevande_enabled and birre_enabled columns already exist');
      return true;
    }
  } catch (error) {
    console.log('❌ Error checking categories table:', error.message);
    return false;
  }
}

async function main() {
  console.log('🍕 PizzaLab - Add Bevande and Birre Features');
  console.log('=============================================\n');
  
  const featuresAdded = await addBevandeAndBirreFeatures();
  const columnsAdded = await addFeatureColumnsToCategories();
  
  if (featuresAdded && columnsAdded) {
    console.log('\n🎉 Success! Bevande and Birre features are now available');
    console.log('📍 You can now manage them in the admin panel:');
    console.log('   - Admin Panel → Caratteristiche Prodotti');
    console.log('   - Admin Panel → Gestione Categorie (to enable/disable per category)');
  } else {
    console.log('\n⚠️  Some steps need manual completion. Follow the instructions above.');
  }
}

main().catch(console.error);

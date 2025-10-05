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

async function createFeatureTypesTable() {
  console.log('🔧 Creating feature_types table for dynamic feature management');
  console.log('===========================================================\n');

  // Try to create table by inserting test data
  const testFeature = {
    name: 'Test Feature',
    slug: 'test-feature-' + Date.now(),
    description: 'Test feature for table creation',
    table_name: 'test_feature_types',
    is_active: false,
    has_categories: true,
    has_price: true,
    has_size: false,
    custom_fields: { test: true }
  };

  try {
    const { data, error } = await supabase
      .from('feature_types')
      .insert([testFeature])
      .select();

    if (error) {
      console.log('❌ Table does not exist. Manual creation required.');
      console.log('\n📋 SQL to create feature_types table:');
      console.log('='.repeat(60));
      
      const sql = `-- Create feature_types table for dynamic feature management
CREATE TABLE IF NOT EXISTS feature_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  table_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  has_categories BOOLEAN DEFAULT false,
  has_price BOOLEAN DEFAULT true,
  has_size BOOLEAN DEFAULT false,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_types_slug ON feature_types(slug);
CREATE INDEX IF NOT EXISTS idx_feature_types_active ON feature_types(is_active);
CREATE INDEX IF NOT EXISTS idx_feature_types_table_name ON feature_types(table_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_feature_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_types_updated_at
  BEFORE UPDATE ON feature_types
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_types_updated_at();

-- Insert existing feature types
INSERT INTO feature_types (name, slug, description, table_name, has_categories, has_price, has_size, custom_fields) VALUES
  ('Aggiunti', 'aggiunti', 'Extra toppings and ingredients for pizzas', 'aggiunti_types', true, true, false, '{"categories": ["formaggi", "salumi", "verdure", "pesce", "contorni"]}'),
  ('Impasto', 'impasto', 'Different dough types for pizzas', 'impasta_types', false, true, false, '{}')
ON CONFLICT (slug) DO NOTHING;`;

      console.log(sql);
      console.log('='.repeat(60));
      console.log('\n🎯 Instructions:');
      console.log('1. Go to: https://supabase.com/dashboard/project/foymsziaullphulzhmxy/sql');
      console.log('2. Copy and paste the SQL above');
      console.log('3. Click "Run" to execute');
      console.log('4. Run this script again to verify');
      
      return false;
    } else {
      console.log('✅ feature_types table exists or was created');
      
      // Remove test data
      await supabase
        .from('feature_types')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test data cleaned up');
      return true;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function verifyFeatureTypes() {
  console.log('\n🔍 Verifying feature_types table...');
  
  try {
    const { data, error } = await supabase
      .from('feature_types')
      .select('*')
      .order('created_at');

    if (error) {
      console.log('❌ Verification failed:', error.message);
      return false;
    }

    console.log(`✅ feature_types table verified with ${data.length} entries`);
    
    if (data.length > 0) {
      console.log('\n📊 Current feature types:');
      data.forEach((feature, index) => {
        const status = feature.is_active ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${feature.name}`);
        console.log(`      📝 Description: ${feature.description}`);
        console.log(`      🗂️  Table: ${feature.table_name}`);
        console.log(`      🏷️  Categories: ${feature.has_categories ? 'Yes' : 'No'}`);
        console.log(`      💰 Price: ${feature.has_price ? 'Yes' : 'No'}`);
        console.log(`      📏 Size: ${feature.has_size ? 'Yes' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  Table exists but no data found');
    }

    return true;
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    return false;
  }
}

async function testFeatureCreation() {
  console.log('\n🧪 Testing feature creation...');
  
  const testFeature = {
    name: 'Test Bevande',
    slug: 'test-bevande',
    description: 'Test drinks feature',
    table_name: 'test_bevande_types',
    is_active: true,
    has_categories: true,
    has_price: true,
    has_size: true,
    custom_fields: {
      categories: ['soft_drinks', 'alcoholic', 'hot_drinks'],
      additional_fields: ['brand', 'temperature', 'alcohol_content']
    }
  };

  try {
    const { data, error } = await supabase
      .from('feature_types')
      .insert([testFeature])
      .select();

    if (error) {
      console.log('❌ Test creation failed:', error.message);
      return false;
    }

    console.log('✅ Test feature created successfully:', data[0].name);
    
    // Clean up test data
    await supabase
      .from('feature_types')
      .delete()
      .eq('id', data[0].id);
    
    console.log('🧹 Test feature cleaned up');
    return true;
  } catch (error) {
    console.log('❌ Test creation error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🍕 PizzaLab Feature Types Table Setup');
  console.log('=====================================\n');
  
  // Check if table exists
  const tableExists = await verifyFeatureTypes();
  
  if (tableExists) {
    console.log('\n🎉 feature_types table already exists and working!');
    
    // Test creation functionality
    const testPassed = await testFeatureCreation();
    
    if (testPassed) {
      console.log('\n✅ Database is ready for dynamic feature creation!');
      console.log('🎯 You can now create new feature types in the admin panel');
      console.log('📍 Go to: Admin Panel → Caratteristiche Prodotti');
    }
    
    return;
  }
  
  // Try to create the table
  const created = await createFeatureTypesTable();
  
  if (!created) {
    console.log('\n⚠️  Manual table creation required');
    console.log('📝 Please run the SQL shown above in Supabase Dashboard');
  }
}

// Run the script
main().catch(console.error);

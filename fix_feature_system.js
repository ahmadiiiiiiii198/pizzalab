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

async function analyzeCurrentSystem() {
  console.log('🔍 Analyzing Current Feature System');
  console.log('===================================\n');

  // 1. Check what feature tables exist
  console.log('📊 Checking existing feature tables...');
  
  const featureTables = ['aggiunti_types', 'impasta_types', 'bevande_types'];
  const existingTables = [];
  const missingTables = [];

  for (const table of featureTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        missingTables.push(table);
        console.log(`❌ ${table}: Missing`);
      } else {
        existingTables.push(table);
        console.log(`✅ ${table}: Exists`);
      }
    } catch (e) {
      missingTables.push(table);
      console.log(`❌ ${table}: Missing`);
    }
  }

  // 2. Check categories feature toggles
  console.log('\n📋 Checking category feature toggles...');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, aggiunti_enabled, bevande_enabled, impasto_enabled')
      .limit(5);
    
    if (error) {
      console.log('❌ Categories error:', error.message);
    } else {
      console.log(`✅ Categories found: ${categories.length}`);
      categories.forEach(cat => {
        console.log(`  - ${cat.name}:`);
        console.log(`    aggiunti: ${cat.aggiunti_enabled}`);
        console.log(`    bevande: ${cat.bevande_enabled}`);
        console.log(`    impasto: ${cat.impasto_enabled}`);
      });
    }
  } catch (e) {
    console.log('❌ Categories error:', e.message);
  }

  return { existingTables, missingTables };
}

async function createMissingTables() {
  console.log('\n🔧 Creating Missing Tables');
  console.log('===========================\n');

  // Create impasta_types table if missing
  console.log('📝 Creating impasta_types table...');
  
  const createImpastaSQL = `
    CREATE TABLE IF NOT EXISTS impasta_types (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      price DECIMAL(10,2) DEFAULT 0.00,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_impasta_types_slug ON impasta_types(slug);
    CREATE INDEX IF NOT EXISTS idx_impasta_types_active ON impasta_types(is_active);
    CREATE INDEX IF NOT EXISTS idx_impasta_types_sort_order ON impasta_types(sort_order);

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_impasta_types_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_impasta_types_updated_at
      BEFORE UPDATE ON impasta_types
      FOR EACH ROW
      EXECUTE FUNCTION update_impasta_types_updated_at();

    -- Insert default impasta types
    INSERT INTO impasta_types (name, slug, description, price, sort_order) VALUES
      ('Impasta Normale', 'impasta-normale', 'Impasta tradizionale', 0.00, 1),
      ('Impasta Integrale', 'impasta-integrale', 'Impasta integrale più salutare', 1.00, 2),
      ('Impasta ai Cereali', 'impasta-cereali', 'Impasta ai cereali misti', 2.00, 3),
      ('Impasta Senza Glutine', 'impasta-senza-glutine', 'Impasta per celiaci', 3.00, 4)
    ON CONFLICT (slug) DO NOTHING;
  `;

  try {
    // Try to insert a test record to create the table
    const testImpasta = {
      name: 'Test Impasta',
      slug: 'test-impasta-temp',
      description: 'Temporary test record',
      price: 0.01,
      is_active: false,
      sort_order: 999
    };

    const { data, error } = await supabase
      .from('impasta_types')
      .insert([testImpasta])
      .select();

    if (error) {
      console.log('❌ impasta_types table does not exist, needs manual creation');
      console.log('\n📋 SQL to create impasta_types table:');
      console.log('=====================================');
      console.log(createImpastaSQL);
      console.log('=====================================');
      return false;
    } else {
      console.log('✅ impasta_types table exists');
      
      // Remove test record
      await supabase
        .from('impasta_types')
        .delete()
        .eq('slug', 'test-impasta-temp');
      
      // Check if it has default data
      const { data: existingData } = await supabase
        .from('impasta_types')
        .select('*')
        .order('sort_order');
      
      if (!existingData || existingData.length === 0) {
        console.log('📝 Adding default impasta types...');
        
        const defaultImpasta = [
          {
            name: 'Impasta Normale',
            slug: 'impasta-normale',
            description: 'Impasta tradizionale',
            price: 0.00,
            sort_order: 1,
            is_active: true
          },
          {
            name: 'Impasta Integrale',
            slug: 'impasta-integrale',
            description: 'Impasta integrale più salutare',
            price: 1.00,
            sort_order: 2,
            is_active: true
          },
          {
            name: 'Impasta ai Cereali',
            slug: 'impasta-cereali',
            description: 'Impasta ai cereali misti',
            price: 2.00,
            sort_order: 3,
            is_active: true
          }
        ];

        const { error: insertError } = await supabase
          .from('impasta_types')
          .insert(defaultImpasta);

        if (insertError) {
          console.log('❌ Error inserting default impasta:', insertError.message);
        } else {
          console.log('✅ Default impasta types added');
        }
      } else {
        console.log(`✅ impasta_types already has ${existingData.length} entries`);
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Error with impasta_types:', error.message);
    return false;
  }
}

async function removeBevandeMistake() {
  console.log('\n🧹 Cleaning Up Bevande Mistake');
  console.log('===============================\n');

  // Check if bevande_types table exists (my mistake)
  try {
    const { data, error } = await supabase
      .from('bevande_types')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('❌ bevande_types table exists - this was my mistake!');
      console.log('💡 This table should be removed as it was not requested');
      console.log('📋 SQL to remove bevande_types table:');
      console.log('DROP TABLE IF EXISTS bevande_types CASCADE;');
      return false;
    } else {
      console.log('✅ bevande_types table does not exist (good!)');
      return true;
    }
  } catch (error) {
    console.log('✅ bevande_types table does not exist (good!)');
    return true;
  }
}

async function explainCorrectApproach() {
  console.log('\n💡 Understanding the Correct Approach');
  console.log('=====================================\n');

  console.log('🎯 What you actually wanted:');
  console.log('- A system to CREATE new feature types dynamically');
  console.log('- Not a fixed "bevande_types" table');
  console.log('- Ability to add new feature categories like "bevande" to the system');
  console.log('');
  
  console.log('🔧 Current System:');
  console.log('- Categories have feature toggles: aggiunti_enabled, bevande_enabled, impasto_enabled');
  console.log('- Feature tables exist: aggiunti_types, impasta_types');
  console.log('- Each feature type has its own table and service');
  console.log('');
  
  console.log('✅ Correct Solution:');
  console.log('- Create a "Feature Type Manager" in admin panel');
  console.log('- Allow dynamic creation of new feature types');
  console.log('- Auto-generate tables, services, and admin interfaces');
  console.log('- Add new feature toggles to categories dynamically');
  console.log('');
  
  console.log('📋 Next Steps:');
  console.log('1. Fix missing impasta_types table');
  console.log('2. Remove bevande_types table (my mistake)');
  console.log('3. Create dynamic feature type creation system');
  console.log('4. Update admin panel to manage feature types');
}

async function main() {
  console.log('🍕 PizzaLab Feature System Analysis & Fix');
  console.log('==========================================\n');

  // Step 1: Analyze current system
  const { existingTables, missingTables } = await analyzeCurrentSystem();

  // Step 2: Create missing tables
  if (missingTables.includes('impasta_types')) {
    await createMissingTables();
  }

  // Step 3: Clean up my mistake
  await removeBevandeMistake();

  // Step 4: Explain the correct approach
  await explainCorrectApproach();

  console.log('\n🎉 Analysis Complete!');
  console.log('📝 Please review the output above for next steps.');
}

// Run the analysis
main().catch(console.error);

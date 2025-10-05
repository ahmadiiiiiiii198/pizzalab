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

async function createTableForFeature(featureType) {
  console.log(`🔧 Creating table for feature: ${featureType.name}`);
  console.log(`📋 Table name: ${featureType.table_name}`);

  // Generate SQL for creating the table
  let sql = `
-- Create ${featureType.table_name} table for ${featureType.name}
CREATE TABLE IF NOT EXISTS ${featureType.table_name} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;

  // Add conditional fields based on feature type properties
  if (featureType.has_price) {
    sql += `,\n  price DECIMAL(10,2) DEFAULT 0.00`;
  }

  if (featureType.has_categories) {
    sql += `,\n  category TEXT`;
  }

  if (featureType.has_size) {
    sql += `,\n  size TEXT`;
  }

  sql += `\n);

-- Create indexes for ${featureType.table_name}
CREATE INDEX IF NOT EXISTS idx_${featureType.table_name}_slug ON ${featureType.table_name}(slug);
CREATE INDEX IF NOT EXISTS idx_${featureType.table_name}_active ON ${featureType.table_name}(is_active);
CREATE INDEX IF NOT EXISTS idx_${featureType.table_name}_sort_order ON ${featureType.table_name}(sort_order);`;

  if (featureType.has_categories) {
    sql += `\nCREATE INDEX IF NOT EXISTS idx_${featureType.table_name}_category ON ${featureType.table_name}(category);`;
  }

  sql += `

-- Create trigger function for ${featureType.table_name} updated_at
CREATE OR REPLACE FUNCTION update_${featureType.table_name}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS trigger_update_${featureType.table_name}_updated_at ON ${featureType.table_name};
CREATE TRIGGER trigger_update_${featureType.table_name}_updated_at
  BEFORE UPDATE ON ${featureType.table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_${featureType.table_name}_updated_at();`;

  // Add sample data if specified in custom_fields
  if (featureType.custom_fields && featureType.custom_fields.sample_data) {
    sql += `\n\n-- Insert sample data for ${featureType.name}`;
    featureType.custom_fields.sample_data.forEach((item, index) => {
      const values = [
        `'${item.name}'`,
        `'${item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}'`,
        item.description ? `'${item.description}'` : 'NULL',
        item.is_active !== undefined ? item.is_active : 'true',
        item.sort_order !== undefined ? item.sort_order : index + 1
      ];

      if (featureType.has_price) {
        values.push(item.price !== undefined ? item.price : '0.00');
      }

      if (featureType.has_categories && item.category) {
        values.push(`'${item.category}'`);
      }

      if (featureType.has_size && item.size) {
        values.push(`'${item.size}'`);
      }

      if (index === 0) {
        sql += `\nINSERT INTO ${featureType.table_name} (name, slug, description, is_active, sort_order`;
        if (featureType.has_price) sql += ', price';
        if (featureType.has_categories) sql += ', category';
        if (featureType.has_size) sql += ', size';
        sql += ') VALUES';
      }

      sql += `\n  (${values.join(', ')})${index < featureType.custom_fields.sample_data.length - 1 ? ',' : ''}`;
    });

    sql += `\nON CONFLICT (slug) DO NOTHING;`;
  }

  return sql;
}

async function createTablesForAllFeatures() {
  console.log('🍕 PizzaLab Dynamic Table Creator');
  console.log('==================================\n');

  try {
    // Get all feature types from database
    const { data: features, error } = await supabase
      .from('feature_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      console.log('❌ Cannot access feature_types table:', error.message);
      console.log('💡 Please create the feature_types table first');
      return;
    }

    console.log(`📋 Found ${features.length} feature types to process:`);
    features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature.name} → ${feature.table_name}`);
    });

    console.log('\n🔧 Generating SQL for table creation...\n');

    for (const feature of features) {
      // Check if table already exists
      const { data: tableExists, error: checkError } = await supabase
        .from(feature.table_name)
        .select('id')
        .limit(1);

      if (!checkError) {
        console.log(`✅ Table ${feature.table_name} already exists`);
        continue;
      }

      console.log(`🆕 Table ${feature.table_name} needs to be created`);
      
      // Generate SQL for this feature
      const sql = await createTableForFeature(feature);
      
      console.log(`\n📄 SQL for ${feature.name}:`);
      console.log('='.repeat(50));
      console.log(sql);
      console.log('='.repeat(50));
      
      console.log(`\n💡 Copy the SQL above and run it in Supabase SQL Editor for ${feature.name}`);
      console.log(`🔗 https://supabase.com/dashboard/project/foymsziaullphulzhmxy/sql\n`);
    }

    console.log('🎯 Summary:');
    console.log('- Copy each SQL block above');
    console.log('- Run them in Supabase SQL Editor');
    console.log('- Refresh your admin panel');
    console.log('- All feature tabs will have full CRUD functionality!');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function createSpecificTable(tableName) {
  console.log(`🔧 Creating specific table: ${tableName}`);
  
  try {
    // Find the feature type for this table
    const { data: feature, error } = await supabase
      .from('feature_types')
      .select('*')
      .eq('table_name', tableName)
      .single();

    if (error) {
      console.log(`❌ Feature type not found for table: ${tableName}`);
      return;
    }

    const sql = await createTableForFeature(feature);
    console.log('\n📄 SQL to create table:');
    console.log('='.repeat(50));
    console.log(sql);
    console.log('='.repeat(50));
    
    console.log(`\n💡 Copy the SQL above and run it in Supabase SQL Editor`);
    console.log(`🔗 https://supabase.com/dashboard/project/foymsziaullphulzhmxy/sql`);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Create specific table
    await createSpecificTable(args[0]);
  } else {
    // Create all tables
    await createTablesForAllFeatures();
  }
}

// Run the script
main().catch(console.error);

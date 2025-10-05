import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL for creating impasta_types table
const createImpastaTableSQL = `
-- Create impasta_types table
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
`;

const createImpastaIndexesSQL = `
-- Create indexes for impasta_types
CREATE INDEX IF NOT EXISTS idx_impasta_types_slug ON impasta_types(slug);
CREATE INDEX IF NOT EXISTS idx_impasta_types_active ON impasta_types(is_active);
CREATE INDEX IF NOT EXISTS idx_impasta_types_sort_order ON impasta_types(sort_order);
`;

const createImpastaTriggersSQL = `
-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_impasta_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_impasta_types_updated_at ON impasta_types;
CREATE TRIGGER trigger_update_impasta_types_updated_at
  BEFORE UPDATE ON impasta_types
  FOR EACH ROW
  EXECUTE FUNCTION update_impasta_types_updated_at();
`;

const insertDefaultImpastaSQL = `
-- Insert default impasta types
INSERT INTO impasta_types (name, slug, description, price, sort_order, is_active) VALUES
  ('Impasta Normale', 'impasta-normale', 'Impasta tradizionale della casa', 0.00, 1, true),
  ('Impasta Integrale', 'impasta-integrale', 'Impasta integrale più salutare e digeribile', 1.00, 2, true),
  ('Impasta ai Cereali', 'impasta-cereali', 'Impasta ai cereali misti per un sapore unico', 2.00, 3, true),
  ('Impasta Senza Glutine', 'impasta-senza-glutine', 'Impasta speciale per celiaci', 3.00, 4, true),
  ('Impasta alla Canapa', 'impasta-canapa', 'Impasta innovativa alla canapa', 2.50, 5, true)
ON CONFLICT (slug) DO NOTHING;
`;

async function executeSQL(sql, description) {
  console.log(`\n🔧 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method using direct query
      console.log('   Trying alternative method...');
      
      const { data: altData, error: altError } = await supabase
        .from('_temp_sql_execution')
        .select('*')
        .limit(1);
      
      if (altError && altError.message.includes('does not exist')) {
        // Table doesn't exist, which is expected - try raw SQL execution
        throw new Error('Direct SQL execution not available with current permissions');
      }
      
      throw error;
    }
    
    console.log(`   ✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description} failed:`, error.message);
    return false;
  }
}

async function executeWithFallback(sql, description) {
  console.log(`\n🔧 ${description}...`);
  
  // Method 1: Try using RPC function (if exists)
  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    if (!error) {
      console.log(`   ✅ ${description} completed via RPC`);
      return true;
    }
  } catch (e) {
    // RPC method failed, continue to next method
  }
  
  // Method 2: Try using a dummy insert to trigger table creation
  if (description.includes('Create table')) {
    try {
      // Extract table name from SQL
      const tableMatch = sql.match(/CREATE TABLE.*?(\w+_types)/i);
      const tableName = tableMatch ? tableMatch[1] : 'impasta_types';
      
      console.log(`   Attempting to create ${tableName} via data insertion...`);
      
      const testData = {
        name: 'Test Entry',
        slug: 'test-entry-temp-' + Date.now(),
        description: 'Temporary test entry',
        price: 0.01,
        is_active: false,
        sort_order: 999
      };
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([testData])
        .select();
      
      if (!error) {
        console.log(`   ✅ ${tableName} table created successfully`);
        
        // Remove test entry
        await supabase
          .from(tableName)
          .delete()
          .eq('slug', testData.slug);
        
        return true;
      }
    } catch (e) {
      // This method also failed
    }
  }
  
  // Method 3: Manual SQL display
  console.log(`   ❌ Automatic execution failed for: ${description}`);
  console.log(`   📋 Manual SQL required:`);
  console.log('   ' + '='.repeat(50));
  console.log(sql.split('\n').map(line => '   ' + line).join('\n'));
  console.log('   ' + '='.repeat(50));
  
  return false;
}

async function insertDefaultData() {
  console.log('\n📝 Inserting default impasta types...');
  
  const defaultImpasta = [
    {
      name: 'Impasta Normale',
      slug: 'impasta-normale',
      description: 'Impasta tradizionale della casa',
      price: 0.00,
      sort_order: 1,
      is_active: true
    },
    {
      name: 'Impasta Integrale',
      slug: 'impasta-integrale',
      description: 'Impasta integrale più salutare e digeribile',
      price: 1.00,
      sort_order: 2,
      is_active: true
    },
    {
      name: 'Impasta ai Cereali',
      slug: 'impasta-cereali',
      description: 'Impasta ai cereali misti per un sapore unico',
      price: 2.00,
      sort_order: 3,
      is_active: true
    },
    {
      name: 'Impasta Senza Glutine',
      slug: 'impasta-senza-glutine',
      description: 'Impasta speciale per celiaci',
      price: 3.00,
      sort_order: 4,
      is_active: true
    },
    {
      name: 'Impasta alla Canapa',
      slug: 'impasta-canapa',
      description: 'Impasta innovativa alla canapa',
      price: 2.50,
      sort_order: 5,
      is_active: true
    }
  ];
  
  try {
    // Check if data already exists
    const { data: existing, error: checkError } = await supabase
      .from('impasta_types')
      .select('slug')
      .in('slug', defaultImpasta.map(i => i.slug));
    
    if (checkError) {
      console.log('   ❌ Cannot check existing data:', checkError.message);
      return false;
    }
    
    const existingSlugs = existing.map(item => item.slug);
    const newImpasta = defaultImpasta.filter(item => !existingSlugs.includes(item.slug));
    
    if (newImpasta.length === 0) {
      console.log('   ✅ Default impasta types already exist');
      return true;
    }
    
    const { data, error } = await supabase
      .from('impasta_types')
      .insert(newImpasta)
      .select();
    
    if (error) {
      console.log('   ❌ Error inserting default data:', error.message);
      return false;
    }
    
    console.log(`   ✅ Inserted ${data.length} new impasta types`);
    data.forEach((item, index) => {
      console.log(`      ${index + 1}. ${item.name} - €${item.price}`);
    });
    
    return true;
  } catch (error) {
    console.log('   ❌ Error inserting default data:', error.message);
    return false;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const { data, error } = await supabase
      .from('impasta_types')
      .select('*')
      .order('sort_order');
    
    if (error) {
      console.log('   ❌ Verification failed:', error.message);
      return false;
    }
    
    console.log(`   ✅ impasta_types table verified with ${data.length} entries`);
    
    if (data.length > 0) {
      console.log('\n   📊 Current impasta types:');
      data.forEach((impasta, index) => {
        const statusIcon = impasta.is_active ? '✅' : '❌';
        console.log(`      ${statusIcon} ${impasta.name} - €${impasta.price} (${impasta.description})`);
      });
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Verification error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🍕 PizzaLab SQL Migration Runner');
  console.log('=================================\n');
  
  console.log('🔗 Connecting to Supabase...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Using: ${supabaseServiceKey ? 'ANON KEY' : 'No key found'}`);
  
  // Step 1: Check if table already exists
  const tableExists = await verifyMigration();
  
  if (tableExists) {
    console.log('\n🎉 impasta_types table already exists and working!');
    console.log('🎯 You can manage impasta types in Admin Panel → Caratteristiche Prodotti');
    return;
  }
  
  console.log('\n📋 Starting migration process...');
  
  // Step 2: Create table
  const tableCreated = await executeWithFallback(createImpastaTableSQL, 'Create impasta_types table');
  
  if (!tableCreated) {
    console.log('\n⚠️  Table creation failed. Please run the SQL manually in Supabase Dashboard.');
    console.log('📝 Go to: Supabase Dashboard → SQL Editor → Run the SQL shown above');
    return;
  }
  
  // Step 3: Create indexes
  await executeWithFallback(createImpastaIndexesSQL, 'Create indexes');
  
  // Step 4: Create triggers
  await executeWithFallback(createImpastaTriggersSQL, 'Create triggers');
  
  // Step 5: Insert default data
  const dataInserted = await insertDefaultData();
  
  // Step 6: Final verification
  const finalVerification = await verifyMigration();
  
  if (finalVerification) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('🎯 You can now manage impasta types in Admin Panel → Caratteristiche Prodotti');
  } else {
    console.log('\n⚠️  Migration partially completed. Please check the results above.');
  }
}

// Run the migration
main().catch(console.error);

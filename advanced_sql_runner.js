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

// Extract project reference from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function tryRestAPIMethod() {
  console.log('\n🌐 Trying Supabase REST API method...');
  
  const sql = `
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

CREATE INDEX IF NOT EXISTS idx_impasta_types_slug ON impasta_types(slug);
CREATE INDEX IF NOT EXISTS idx_impasta_types_active ON impasta_types(is_active);
CREATE INDEX IF NOT EXISTS idx_impasta_types_sort_order ON impasta_types(sort_order);

CREATE OR REPLACE FUNCTION update_impasta_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_impasta_types_updated_at ON impasta_types;
CREATE TRIGGER trigger_update_impasta_types_updated_at
  BEFORE UPDATE ON impasta_types
  FOR EACH ROW
  EXECUTE FUNCTION update_impasta_types_updated_at();
`;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      console.log('   ✅ Table created via REST API');
      return true;
    } else {
      const error = await response.text();
      console.log('   ❌ REST API failed:', error);
      return false;
    }
  } catch (error) {
    console.log('   ❌ REST API error:', error.message);
    return false;
  }
}

async function tryRPCMethod() {
  console.log('\n🔧 Trying RPC method...');
  
  const sql = `
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

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (!error) {
      console.log('   ✅ Table created via RPC');
      return true;
    } else {
      console.log('   ❌ RPC failed:', error.message);
      return false;
    }
  } catch (error) {
    console.log('   ❌ RPC error:', error.message);
    return false;
  }
}

async function tryInsertMethod() {
  console.log('\n📝 Trying table creation via data insertion...');
  
  const testData = {
    name: 'Impasta Normale',
    slug: 'impasta-normale',
    description: 'Impasta tradizionale della casa',
    price: 0.00,
    sort_order: 1,
    is_active: true
  };

  try {
    const { data, error } = await supabase
      .from('impasta_types')
      .insert([testData])
      .select();

    if (!error) {
      console.log('   ✅ Table exists or was created via insertion');
      console.log('   📝 Inserted test data:', data[0].name);
      return true;
    } else {
      console.log('   ❌ Insertion failed:', error.message);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Insertion error:', error.message);
    return false;
  }
}

async function insertDefaultData() {
  console.log('\n📋 Inserting default impasta types...');
  
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
    // Check existing data first
    const { data: existing } = await supabase
      .from('impasta_types')
      .select('slug');

    const existingSlugs = existing ? existing.map(item => item.slug) : [];
    const newItems = defaultImpasta.filter(item => !existingSlugs.includes(item.slug));

    if (newItems.length === 0) {
      console.log('   ✅ All default impasta types already exist');
      return true;
    }

    const { data, error } = await supabase
      .from('impasta_types')
      .insert(newItems)
      .select();

    if (error) {
      console.log('   ❌ Error inserting data:', error.message);
      return false;
    }

    console.log(`   ✅ Inserted ${data.length} new impasta types:`);
    data.forEach((item, index) => {
      console.log(`      ${index + 1}. ${item.name} - €${item.price}`);
    });

    return true;
  } catch (error) {
    console.log('   ❌ Error inserting data:', error.message);
    return false;
  }
}

async function verifyTable() {
  console.log('\n🔍 Verifying impasta_types table...');
  
  try {
    const { data, error } = await supabase
      .from('impasta_types')
      .select('*')
      .order('sort_order');

    if (error) {
      console.log('   ❌ Table verification failed:', error.message);
      return false;
    }

    console.log(`   ✅ Table verified with ${data.length} entries`);
    
    if (data.length > 0) {
      console.log('\n   📊 Current impasta types:');
      data.forEach((item, index) => {
        const status = item.is_active ? '✅' : '❌';
        console.log(`      ${status} ${item.name} - €${item.price}`);
      });
    }

    return true;
  } catch (error) {
    console.log('   ❌ Verification error:', error.message);
    return false;
  }
}

async function showManualInstructions() {
  console.log('\n📋 Manual SQL Instructions');
  console.log('===========================\n');
  
  console.log('🔗 Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.log('\n📝 Copy and paste this SQL:');
  console.log('='.repeat(60));
  
  const sql = `-- Create impasta_types table for PizzaLab
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_impasta_types_slug ON impasta_types(slug);
CREATE INDEX IF NOT EXISTS idx_impasta_types_active ON impasta_types(is_active);
CREATE INDEX IF NOT EXISTS idx_impasta_types_sort_order ON impasta_types(sort_order);

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

-- Insert default impasta types
INSERT INTO impasta_types (name, slug, description, price, sort_order, is_active) VALUES
  ('Impasta Normale', 'impasta-normale', 'Impasta tradizionale della casa', 0.00, 1, true),
  ('Impasta Integrale', 'impasta-integrale', 'Impasta integrale più salutare e digeribile', 1.00, 2, true),
  ('Impasta ai Cereali', 'impasta-cereali', 'Impasta ai cereali misti per un sapore unico', 2.00, 3, true),
  ('Impasta Senza Glutine', 'impasta-senza-glutine', 'Impasta speciale per celiaci', 3.00, 4, true),
  ('Impasta alla Canapa', 'impasta-canapa', 'Impasta innovativa alla canapa', 2.50, 5, true)
ON CONFLICT (slug) DO NOTHING;`;

  console.log(sql);
  console.log('='.repeat(60));
  console.log('\n🎯 After running the SQL, execute this script again to verify:');
  console.log('   node advanced_sql_runner.js');
}

async function main() {
  console.log('🍕 Advanced SQL Migration Runner');
  console.log('=================================\n');
  
  // First check if table already exists
  const tableExists = await verifyTable();
  
  if (tableExists) {
    console.log('\n🎉 impasta_types table already exists and working!');
    console.log('🎯 You can manage impasta types in Admin Panel → Caratteristiche Prodotti');
    return;
  }
  
  console.log('📋 Table does not exist. Trying multiple creation methods...\n');
  
  // Try different methods to create the table
  let success = false;
  
  // Method 1: REST API
  success = await tryRestAPIMethod();
  if (success) {
    await insertDefaultData();
    await verifyTable();
    return;
  }
  
  // Method 2: RPC
  success = await tryRPCMethod();
  if (success) {
    await insertDefaultData();
    await verifyTable();
    return;
  }
  
  // Method 3: Direct insertion (might auto-create table)
  success = await tryInsertMethod();
  if (success) {
    await insertDefaultData();
    await verifyTable();
    return;
  }
  
  // All methods failed - show manual instructions
  console.log('\n⚠️  All automatic methods failed');
  showManualInstructions();
}

// Run the script
main().catch(console.error);

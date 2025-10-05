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

async function createImpastaTable() {
  console.log('🍕 Creating impasta_types table');
  console.log('================================\n');

  // Try to create table by inserting data (Supabase auto-creates)
  console.log('📝 Attempting to create impasta_types table...');
  
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
    },
    {
      name: 'Impasta Senza Glutine',
      slug: 'impasta-senza-glutine',
      description: 'Impasta per celiaci',
      price: 3.00,
      sort_order: 4,
      is_active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('impasta_types')
      .insert(defaultImpasta)
      .select();

    if (error) {
      console.log('❌ Table creation failed:', error.message);
      console.log('\n📋 Manual SQL required:');
      console.log('Go to Supabase Dashboard → SQL Editor and run:');
      console.log('='.repeat(50));
      
      const createSQL = `-- Create impasta_types table
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
ON CONFLICT (slug) DO NOTHING;`;

      console.log(createSQL);
      console.log('='.repeat(50));
      console.log('\nThen run this script again to verify.');
      return false;
    } else {
      console.log(`✅ impasta_types table created with ${data.length} default entries`);
      
      console.log('\n📋 Created impasta types:');
      data.forEach((impasta, index) => {
        console.log(`   ${index + 1}. ${impasta.name} - €${impasta.price}`);
      });
      
      return true;
    }
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    return false;
  }
}

async function verifyImpastaTable() {
  console.log('\n🔍 Verifying impasta_types table...');
  
  try {
    const { data, error } = await supabase
      .from('impasta_types')
      .select('*')
      .order('sort_order');

    if (error) {
      console.log('❌ Verification failed:', error.message);
      return false;
    }

    console.log(`✅ impasta_types table verified with ${data.length} entries`);
    
    if (data.length > 0) {
      console.log('\n📊 Current impasta types:');
      data.forEach((impasta, index) => {
        const statusIcon = impasta.is_active ? '✅' : '❌';
        console.log(`   ${statusIcon} ${impasta.name} - €${impasta.price} (${impasta.description})`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

async function main() {
  // First check if table already exists
  const tableExists = await verifyImpastaTable();
  
  if (tableExists) {
    console.log('\n🎉 impasta_types table already exists and working!');
    console.log('🎯 You can manage impasta types in Admin Panel → Caratteristiche Prodotti → Impasto');
    return;
  }
  
  // Try to create the table
  const created = await createImpastaTable();
  
  if (created) {
    console.log('\n🎉 impasta_types table created successfully!');
    console.log('🎯 You can now manage impasta types in Admin Panel → Caratteristiche Prodotti → Impasto');
  } else {
    console.log('\n⚠️  Manual table creation required');
    console.log('📝 Please run the SQL shown above in Supabase Dashboard');
  }
}

// Run the script
main().catch(console.error);

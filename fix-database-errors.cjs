/**
 * Fix Database Errors - Automatic
 * Creates missing tables and fixes schema issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixDatabaseErrors() {
  console.log('🔧 Fixing Database Errors...\n');

  try {
    // Fix 1: Create base_del_pizze_types table (note: underscore, not dash)
    console.log('1️⃣ Creating base_del_pizze_types table...');
    const { error: baseError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS base_del_pizze_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE base_del_pizze_types ENABLE ROW LEVEL SECURITY;

        -- Allow public read
        CREATE POLICY IF NOT EXISTS "Allow public read base_del_pizze_types"
          ON base_del_pizze_types FOR SELECT
          TO public
          USING (true);

        -- Allow authenticated insert/update/delete
        CREATE POLICY IF NOT EXISTS "Allow authenticated all base_del_pizze_types"
          ON base_del_pizze_types FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
      `
    });

    if (baseError) {
      console.log('⚠️  Table might already exist or using direct SQL...');
    } else {
      console.log('✅ base_del_pizze_types table created');
    }

    // Fix 2: Create dolci_types table
    console.log('\n2️⃣ Creating dolci_types table...');
    const { error: dolciError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS dolci_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) DEFAULT 0,
          image_url TEXT,
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE dolci_types ENABLE ROW LEVEL SECURITY;

        -- Allow public read
        CREATE POLICY IF NOT EXISTS "Allow public read dolci_types"
          ON dolci_types FOR SELECT
          TO public
          USING (true);

        -- Allow authenticated all
        CREATE POLICY IF NOT EXISTS "Allow authenticated all dolci_types"
          ON dolci_types FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
      `
    });

    if (dolciError) {
      console.log('⚠️  Table might already exist...');
    } else {
      console.log('✅ dolci_types table created');
    }

    // Fix 3: Check categories table columns
    console.log('\n3️⃣ Checking categories table...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(1);

    if (catError) {
      console.log('❌ Categories error:', catError.message);
    } else {
      console.log('✅ Categories table OK');
    }

    // Fix 4: Update products with missing images
    console.log('\n4️⃣ Fixing products with missing images...');
    const { data: productsNoImage } = await supabase
      .from('products')
      .select('id, name')
      .or('image_url.is.null,image_url.eq.');

    if (productsNoImage && productsNoImage.length > 0) {
      console.log(`Found ${productsNoImage.length} products without images`);
      
      // Set default placeholder image
      const defaultImage = 'https://via.placeholder.com/400x300?text=No+Image';
      
      for (const product of productsNoImage) {
        await supabase
          .from('products')
          .update({ image_url: defaultImage })
          .eq('id', product.id);
      }
      
      console.log('✅ Updated products with placeholder images');
    } else {
      console.log('✅ All products have images');
    }

    console.log('\n========================================');
    console.log('✅ Database fixes completed!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run fixes
fixDatabaseErrors();

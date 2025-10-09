/**
 * Accurate Menu Import Script for PIZZALAB
 * Based on detailed analysis of all 10 menu images
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = "https://jncuwwavffepnajxvjxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo";

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function loadAccurateMenuData() {
  try {
    const dataPath = path.join(__dirname, 'accurate_menu_from_images.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Error loading accurate menu data:', error.message);
    return null;
  }
}

async function testConnection() {
  console.log('🔗 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing menu data...');
  
  try {
    // Delete existing products first
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (productsError) {
      console.warn('⚠️ Error clearing products:', productsError.message);
    } else {
      console.log('✅ Cleared existing products');
    }
    
    // Delete existing categories
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (categoriesError) {
      console.warn('⚠️ Error clearing categories:', categoriesError.message);
    } else {
      console.log('✅ Cleared existing categories');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

async function importCategories(categories) {
  console.log('\n📂 Importing categories...');
  
  const categoryMap = new Map();
  let created = 0;
  
  for (const category of categories) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          slug: category.slug,
          description: category.description,
          is_active: true,
          sort_order: category.sort_order
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Created category: ${category.name}`);
      categoryMap.set(category.slug, data.id);
      created++;
      
    } catch (error) {
      console.error(`❌ Error with category ${category.name}:`, error.message);
    }
  }
  
  console.log(`📊 Created ${created} categories`);
  return categoryMap;
}

async function importProducts(products, categoryMap) {
  console.log('\n🍕 Importing products...');
  
  let created = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      const categoryId = categoryMap.get(product.category_slug);
      
      if (!categoryId) {
        console.warn(`⚠️ Category not found: ${product.category_slug} for product: ${product.name}`);
        errors++;
        continue;
      }
      
      const slug = generateSlug(product.name);
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          slug: slug,
          description: product.description,
          price: product.price,
          category_id: categoryId,
          is_active: true,
          is_featured: product.is_featured || false,
          stock_quantity: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const featuredIcon = product.is_featured ? ' ⭐' : '';
      console.log(`✅ Created: ${product.name} - €${product.price}${featuredIcon}`);
      created++;
      
    } catch (error) {
      console.error(`❌ Error with product ${product.name}:`, error.message);
      errors++;
    }
  }
  
  console.log(`📊 Created ${created} products, ${errors} errors`);
  return { created, errors };
}

async function main() {
  console.log('🍕 Starting ACCURATE PIZZALAB menu import...');
  console.log('📸 Based on detailed analysis of all 10 menu images\n');
  
  const connected = await testConnection();
  if (!connected) {
    return;
  }
  
  const menuData = await loadAccurateMenuData();
  if (!menuData) {
    return;
  }
  
  console.log(`📋 Loaded ${menuData.categories.length} categories and ${menuData.products.length} products`);
  
  // Ask for confirmation
  console.log('\n⚠️  This will replace ALL existing menu data with accurate data from images!');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Clear and import
  await clearExistingData();
  
  const { categories, products } = menuData;
  
  const categoryMap = await importCategories(categories);
  const results = await importProducts(products, categoryMap);
  
  console.log('\n🎉 ACCURATE MENU IMPORT COMPLETED!');
  console.log('📈 Final Summary:');
  console.log(`   Categories: ${categoryMap.size} created`);
  console.log(`   Products: ${results.created} created`);
  console.log(`   Featured items: ${products.filter(p => p.is_featured).length} marked`);
  
  if (results.errors > 0) {
    console.log(`   ⚠️ Errors: ${results.errors}`);
  }
  
  console.log('\n🌐 Your PIZZALAB website now has the ACCURATE menu!');
  console.log('📸 Menu images available in: c:\\Users\\39351\\Downloads\\m (1)\\');
  console.log('🔧 Next: Use admin panel to upload these images to products');
}

main().catch(console.error);

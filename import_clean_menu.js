#!/usr/bin/env node
/**
 * Clean Menu Data Import Script for PIZZALAB
 * Imports clean menu data into Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration (using same config as the app)
const supabaseUrl = "https://jncuwwavffepnajxvjxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo";

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim();
}

/**
 * Test database connection
 */
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

/**
 * Import categories
 */
async function importCategories(categories) {
  console.log('\n📂 Importing categories...');
  
  const categoryMap = new Map();
  let created = 0;
  let existing = 0;
  
  for (const category of categories) {
    try {
      // Check if category already exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', category.slug)
        .single();
      
      if (existingCategory) {
        console.log(`📂 Category already exists: ${category.name}`);
        categoryMap.set(category.slug, existingCategory.id);
        existing++;
        continue;
      }
      
      // Create new category
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
  
  console.log(`📊 Categories: ${created} created, ${existing} existing`);
  return categoryMap;
}

/**
 * Import products
 */
async function importProducts(products, categoryMap) {
  console.log('\n🍕 Importing products...');
  
  let created = 0;
  let existing = 0;
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
      
      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, name')
        .eq('slug', slug)
        .single();
      
      if (existingProduct) {
        console.log(`🍕 Product already exists: ${product.name}`);
        existing++;
        continue;
      }
      
      // Create new product
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
          stock_quantity: null, // Unlimited stock
          sort_order: products.indexOf(product)
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Created product: ${product.name} - €${product.price}`);
      created++;
      
    } catch (error) {
      console.error(`❌ Error with product ${product.name}:`, error.message);
      errors++;
    }
  }
  
  console.log(`📊 Products: ${created} created, ${existing} existing, ${errors} errors`);
  return { created, existing, errors };
}

/**
 * Load menu data from JSON file
 */
function loadMenuData() {
  try {
    const dataPath = path.join(__dirname, 'menu_data_clean.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('Clean menu data file not found: menu_data_clean.json');
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const menuData = JSON.parse(rawData);
    
    console.log(`📊 Loaded ${menuData.categories.length} categories and ${menuData.products.length} products`);
    
    return menuData;
  } catch (error) {
    console.error('❌ Error loading menu data:', error.message);
    return null;
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting PIZZALAB menu import...\n');
  
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Please check your Supabase configuration and internet connection');
    return;
  }
  
  // Load menu data
  const menuData = loadMenuData();
  if (!menuData) {
    return;
  }
  
  const { categories, products } = menuData;
  
  // Import categories first
  const categoryMap = await importCategories(categories);
  
  // Then import products
  const results = await importProducts(products, categoryMap);
  
  console.log('\n🎉 Import completed!');
  console.log('📈 Summary:');
  console.log(`   Categories: ${categoryMap.size} total`);
  console.log(`   Products: ${results.created} created, ${results.existing} existing`);
  
  if (results.errors > 0) {
    console.log(`   ⚠️ Errors: ${results.errors}`);
  }
  
  console.log('\n🌐 Next steps:');
  console.log('1. Check your website to see the new products');
  console.log('2. Use the admin panel to add images and fine-tune details');
  console.log('3. Set featured products and adjust descriptions');
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Import failed:', error);
    process.exit(1);
  });
}

export { main as importCleanMenu };

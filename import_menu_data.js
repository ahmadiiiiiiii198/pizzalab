#!/usr/bin/env node
/**
 * Menu Data Import Script for PIZZALAB
 * Imports extracted menu data into Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

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
 * Create categories in the database
 */
async function importCategories(categories) {
  console.log('📂 Importing categories...');
  
  const categoryMap = new Map();
  
  for (const category of categories) {
    const slug = generateSlug(category.name);
    
    // Check if category already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      console.log(`📂 Category already exists: ${category.name}`);
      categoryMap.set(category.name, existing.id);
      continue;
    }
    
    // Create new category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: slug,
        description: `Categoria ${category.name}`,
        is_active: true,
        sort_order: categories.indexOf(category)
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error creating category ${category.name}:`, error);
      continue;
    }
    
    console.log(`✅ Created category: ${category.name} (${data.id})`);
    categoryMap.set(category.name, data.id);
  }
  
  return categoryMap;
}

/**
 * Create products in the database
 */
async function importProducts(products, categoryMap) {
  console.log('🍕 Importing products...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    const slug = generateSlug(product.name);
    const categoryId = categoryMap.get(product.category);
    
    if (!categoryId) {
      console.warn(`⚠️ Category not found for product: ${product.name} (${product.category})`);
      errorCount++;
      continue;
    }
    
    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, name')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      console.log(`🍕 Product already exists: ${product.name}`);
      continue;
    }
    
    // Create new product
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        slug: slug,
        description: product.description || `Delizioso ${product.name}`,
        price: product.price,
        category_id: categoryId,
        is_active: true,
        is_featured: false,
        stock_quantity: null, // Unlimited stock
        sort_order: products.indexOf(product)
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error creating product ${product.name}:`, error);
      errorCount++;
      continue;
    }
    
    console.log(`✅ Created product: ${product.name} - €${product.price}`);
    successCount++;
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`✅ Successfully imported: ${successCount} products`);
  console.log(`❌ Errors: ${errorCount} products`);
  
  return { successCount, errorCount };
}

/**
 * Load extracted data from JSON files
 */
function loadExtractedData() {
  const dataDir = path.join(__dirname, 'extracted_menu_data');
  
  try {
    const categoriesPath = path.join(dataDir, 'extracted_categories.json');
    const productsPath = path.join(dataDir, 'extracted_products.json');
    
    if (!fs.existsSync(categoriesPath) || !fs.existsSync(productsPath)) {
      throw new Error('Extracted data files not found. Run extract_pdf_menu.py first.');
    }
    
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    
    console.log(`📊 Loaded ${categories.length} categories and ${products.length} products`);
    
    return { categories, products };
  } catch (error) {
    console.error('❌ Error loading extracted data:', error.message);
    return null;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  console.log('🔗 Testing database connection...');
  
  const { data, error } = await supabase
    .from('categories')
    .select('count(*)')
    .limit(1);
  
  if (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
  
  console.log('✅ Database connection successful');
  return true;
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting menu data import...\n');
  
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Please check your Supabase configuration in .env file');
    return;
  }
  
  // Load extracted data
  const data = loadExtractedData();
  if (!data) {
    return;
  }
  
  const { categories, products } = data;
  
  // Import categories first
  const categoryMap = await importCategories(categories);
  
  // Then import products
  await importProducts(products, categoryMap);
  
  console.log('\n✅ Import completed!');
  console.log('🌐 Check your website to see the new products');
  console.log('⚙️ Use the admin panel to fine-tune product details');
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as importMenuData };

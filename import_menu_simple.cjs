/**
 * Simple Menu Import Script for PIZZALAB
 * Uses CommonJS for better compatibility
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = "https://jncuwwavffepnajxvjxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo";

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample menu data (based on extracted PDF content)
const menuData = {
  categories: [
    {
      name: "Da Stuzzicare",
      slug: "da-stuzzicare",
      description: "Antipasti e stuzzichini per iniziare",
      sort_order: 1
    },
    {
      name: "Pizze Rosse",
      slug: "pizze-rosse", 
      description: "Pizze classiche con pomodoro",
      sort_order: 2
    },
    {
      name: "Pizze Bianche",
      slug: "pizze-bianche",
      description: "Pizze bianche senza pomodoro", 
      sort_order: 3
    },
    {
      name: "Bevande",
      slug: "bevande",
      description: "Bevande analcoliche e vini",
      sort_order: 4
    },
    {
      name: "Birre",
      slug: "birre",
      description: "Birre alla spina e in bottiglia", 
      sort_order: 5
    }
  ],
  products: [
    {
      name: "Panissa",
      description: "Specialità ligure con ceci",
      price: 7.00,
      category_slug: "da-stuzzicare"
    },
    {
      name: "Sarde Acciughe Panissa", 
      description: "Panissa con sarde e acciughe",
      price: 10.00,
      category_slug: "da-stuzzicare"
    },
    {
      name: "Fior di Zucca",
      description: "Fiori di zucca fritti",
      price: 9.00,
      category_slug: "da-stuzzicare"
    },
    {
      name: "Fish and Chips",
      description: "Pesce fritto con patatine",
      price: 9.00,
      category_slug: "da-stuzzicare"
    },
    {
      name: "Arancini (3 pezzi)",
      description: "Arancini siciliani, 3 pezzi",
      price: 9.00,
      category_slug: "da-stuzzicare"
    },
    {
      name: "Focaccia al Rosmarino",
      description: "Focaccia fresca con rosmarino",
      price: 4.00,
      category_slug: "da-stuzzicare"
    },
    {
      name: "Acqua Naturale",
      description: "Acqua naturale microfiltrata",
      price: 1.50,
      category_slug: "bevande"
    },
    {
      name: "Coca-Cola",
      description: "Coca-Cola classica",
      price: 3.00,
      category_slug: "bevande"
    },
    {
      name: "Aranciata",
      description: "Aranciata fresca",
      price: 3.00,
      category_slug: "bevande"
    },
    {
      name: "Vino Sfuso - Calice",
      description: "Vino della casa al calice",
      price: 5.00,
      category_slug: "bevande"
    }
  ]
};

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
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

async function importCategories(categories) {
  console.log('\n📂 Importing categories...');
  
  const categoryMap = new Map();
  
  for (const category of categories) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', category.slug)
        .single();
      
      if (existing) {
        console.log(`📂 Category exists: ${category.name}`);
        categoryMap.set(category.slug, existing.id);
        continue;
      }
      
      // Create new
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
      
    } catch (error) {
      console.error(`❌ Error with category ${category.name}:`, error.message);
    }
  }
  
  return categoryMap;
}

async function importProducts(products, categoryMap) {
  console.log('\n🍕 Importing products...');
  
  let created = 0;
  
  for (const product of products) {
    try {
      const categoryId = categoryMap.get(product.category_slug);
      
      if (!categoryId) {
        console.warn(`⚠️ Category not found: ${product.category_slug}`);
        continue;
      }
      
      const slug = generateSlug(product.name);
      
      // Check if exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (existing) {
        console.log(`🍕 Product exists: ${product.name}`);
        continue;
      }
      
      // Create new
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          slug: slug,
          description: product.description,
          price: product.price,
          category_id: categoryId,
          is_active: true,
          stock_quantity: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Created: ${product.name} - €${product.price}`);
      created++;
      
    } catch (error) {
      console.error(`❌ Error with product ${product.name}:`, error.message);
    }
  }
  
  console.log(`📊 Created ${created} products`);
}

async function main() {
  console.log('🚀 Starting PIZZALAB menu import...\n');
  
  const connected = await testConnection();
  if (!connected) {
    return;
  }
  
  const { categories, products } = menuData;
  
  const categoryMap = await importCategories(categories);
  await importProducts(products, categoryMap);
  
  console.log('\n🎉 Import completed!');
  console.log('🌐 Check your website to see the new products');
}

main().catch(console.error);

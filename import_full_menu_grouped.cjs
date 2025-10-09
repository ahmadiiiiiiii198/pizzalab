/**
 * Full Menu Import (Grouped) for PIZZALAB
 * - Loads full_menu_grouped_from_images.json
 * - UPSERTS categories (by slug) and products (by slug)
 * - Keeps bottled beers grouped as a single item
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration (same as app client)
const supabaseUrl = "https://jncuwwavffepnajxvjxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo";

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function loadData() {
  const dataPath = path.join(__dirname, 'full_menu_grouped_from_images.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('Data file not found: full_menu_grouped_from_images.json');
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(raw);
}

async function testConnection() {
  const { error } = await supabase.from('categories').select('id').limit(1);
  if (error) throw error;
}

async function upsertCategories(categories) {
  console.log('\n📂 Upserting categories...');
  const map = new Map();
  let created = 0, updated = 0, errors = 0;

  for (const cat of categories) {
    const slug = cat.slug || slugify(cat.name);
    try {
      const { data: existing, error: selErr } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing && existing.id) {
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: cat.name,
            description: cat.description ?? null,
            is_active: true,
            sort_order: cat.sort_order ?? null,
            slug,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        map.set(slug, data.id);
        updated++;
        console.log(`♻️  Updated category: ${cat.name}`);
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: cat.name,
            slug,
            description: cat.description ?? null,
            is_active: true,
            sort_order: cat.sort_order ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        map.set(slug, data.id);
        created++;
        console.log(`✅ Created category: ${cat.name}`);
      }
    } catch (err) {
      console.error(`❌ Category error (${cat.name}):`, err.message);
      errors++;
    }
  }

  console.log(`📊 Categories — created: ${created}, updated: ${updated}, errors: ${errors}`);
  return map;
}

async function upsertProducts(products, categoryMap) {
  console.log('\n🍕 Upserting products...');
  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const p of products) {
    const slug = slugify(p.slug || p.name);
    const categoryId = categoryMap.get(p.category_slug);
    if (!categoryId) {
      console.warn(`⚠️  Missing category '${p.category_slug}' for product '${p.name}', skipping`);
      skipped++;
      continue;
    }

    try {
      const { data: existing, error: selErr } = await supabase
        .from('products')
        .select('id, slug')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle();
      if (selErr) throw selErr;

      const payload = {
        name: p.name,
        slug,
        description: p.description ?? null,
        price: typeof p.price === 'number' ? p.price : null,
        category_id: categoryId,
        is_active: true,
        is_featured: Boolean(p.is_featured) || false,
        stock_quantity: null,
        sort_order: null,
      };

      if (existing && existing.id) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
        updated++;
        console.log(`♻️  Updated: ${p.name}`);
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload);
        if (error) throw error;
        created++;
        console.log(`✅ Created: ${p.name}${payload.price != null ? ` - €${payload.price}` : ''}`);
      }
    } catch (err) {
      console.error(`❌ Product error (${p.name}):`, err.message);
      errors++;
    }
  }

  console.log(`📊 Products — created: ${created}, updated: ${updated}, skipped: ${skipped}, errors: ${errors}`);
}

async function main() {
  console.log('🚀 Starting FULL MENU (grouped) import...');
  try {
    await testConnection();
    const data = loadData();
    console.log(`📋 Loaded ${data.categories.length} categories and ${data.products.length} products from JSON`);

    const categoryMap = await upsertCategories(data.categories || []);
    await upsertProducts(data.products || [], categoryMap);

    console.log('\n🎉 Import finished! No data was deleted; items were upserted.');
  } catch (e) {
    console.error('💥 Import failed:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

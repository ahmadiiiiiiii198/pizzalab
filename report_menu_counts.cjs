/**
 * Report current menu stats from Supabase
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jncuwwavffepnajxvjxq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuY3V3d2F2ZmZlcG5hanh2anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzMxMjUsImV4cCI6MjA3NTQwOTEyNX0.wDlEZbpy1rfAk8GtzuqB28qINkAG3GbqMxVZmW85hzo";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true, nullsFirst: true });
  if (catErr) throw catErr;

  const { count: prodCount, error: prodErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  if (prodErr) throw prodErr;

  console.log(`Categories: ${cats.length}`);
  console.log(`Products: ${prodCount}`);

  for (const c of cats) {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', c.id);
    if (error) throw error;
    console.log(` - ${c.name} (${c.slug}): ${count}`);
  }
}

main().catch(e => { console.error('Report failed:', e.message); process.exit(1); });

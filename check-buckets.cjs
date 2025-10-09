const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkBuckets() {
  console.log('🔍 Checking Supabase Storage Buckets...\n');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('📦 Available buckets:');
  buckets.forEach(bucket => {
    console.log(`   ✓ ${bucket.name} (${bucket.public ? 'PUBLIC' : 'PRIVATE'})`);
  });
  
  const hasGallery = buckets.some(b => b.name === 'gallery');
  const hasImages = buckets.some(b => b.name === 'images');
  
  console.log('\n🎯 Analysis:');
  console.log(`   Gallery bucket exists: ${hasGallery ? '✅ YES' : '❌ NO'}`);
  console.log(`   Images bucket exists: ${hasImages ? '✅ YES' : '❌ NO'}`);
  
  if (!hasGallery) {
    console.log('\n⚠️  PROBLEM FOUND: Gallery bucket does not exist!');
    console.log('   The code is trying to upload to "gallery" bucket but it doesn\'t exist.');
    console.log('   Available buckets:', buckets.map(b => b.name).join(', '));
    console.log('\n💡 SOLUTION: We need to either:');
    console.log('   1. Create a "gallery" bucket in Supabase, OR');
    console.log('   2. Use one of the existing buckets (e.g., "uploads")');
  }
}

checkBuckets().catch(console.error);

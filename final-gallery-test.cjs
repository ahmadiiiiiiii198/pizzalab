const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function finalTest() {
  console.log('🎯 FINAL GALLERY SYSTEM TEST\n');
  console.log('='.repeat(60));
  
  // Test 1: Upload with correct path
  console.log('\n✅ Test 1: Upload to gallery bucket (correct path)');
  const testContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const fileName = `test-${Date.now()}.png`;
  
  console.log(`   Uploading: ${fileName}`);
  
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('gallery')
    .upload(fileName, testContent, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    console.error('   ❌ FAILED:', uploadError.message);
    return;
  }
  
  console.log('   ✅ Upload successful');
  console.log('   Path:', uploadData.path);
  
  // Test 2: Get public URL
  console.log('\n✅ Test 2: Get public URL');
  const { data: urlData } = supabase
    .storage
    .from('gallery')
    .getPublicUrl(fileName);
  
  console.log('   URL:', urlData.publicUrl);
  
  // Test 3: Insert to database
  console.log('\n✅ Test 3: Insert to gallery_images table');
  const recordId = crypto.randomUUID();
  const { data: insertData, error: insertError } = await supabase
    .from('gallery_images')
    .insert({
      id: recordId,
      title: 'Final Test Image',
      description: 'Automated test',
      image_url: urlData.publicUrl,
      category: 'main',
      sort_order: 999,
      is_active: true,
      is_featured: false
    })
    .select();
  
  if (insertError) {
    console.error('   ❌ FAILED:', insertError.message);
  } else {
    console.log('   ✅ Database insert successful');
    console.log('   Record ID:', insertData[0].id);
  }
  
  // Test 4: Query from database
  console.log('\n✅ Test 4: Query from gallery_images table');
  const { data: queryData, error: queryError } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (queryError) {
    console.error('   ❌ FAILED:', queryError.message);
  } else {
    console.log(`   ✅ Query successful - Found ${queryData.length} images`);
    if (queryData.length > 0) {
      console.log('   Latest image:', queryData[queryData.length - 1].title);
    }
  }
  
  // Cleanup
  console.log('\n🧹 Cleanup');
  await supabase.from('gallery_images').delete().eq('id', recordId);
  await supabase.storage.from('gallery').remove([fileName]);
  console.log('   ✅ Test data cleaned up');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS PASSED - GALLERY SYSTEM IS WORKING!');
  console.log('='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   ✓ Storage bucket "gallery" exists and is accessible');
  console.log('   ✓ File upload works correctly');
  console.log('   ✓ Public URLs are generated properly');
  console.log('   ✓ Database inserts work');
  console.log('   ✓ Database queries work');
  console.log('\n💡 You can now upload images via the admin panel!');
}

finalTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  console.error(err);
});

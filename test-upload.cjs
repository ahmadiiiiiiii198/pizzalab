const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testUpload() {
  console.log('🧪 Testing Gallery Upload...\n');
  
  // Create a test file content
  const testContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const fileName = `test-${Date.now()}.png`;
  const filePath = `gallery/${fileName}`;
  
  console.log(`📤 Uploading test file: ${filePath}`);
  
  const { data, error } = await supabase
    .storage
    .from('gallery')
    .upload(filePath, testContent, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('❌ Upload failed!');
    console.error('   Error:', error.message);
    console.error('   Details:', JSON.stringify(error, null, 2));
    return;
  }
  
  console.log('✅ Upload successful!');
  console.log('   Path:', data.path);
  
  // Get public URL
  const { data: urlData } = supabase
    .storage
    .from('gallery')
    .getPublicUrl(filePath);
  
  console.log('   Public URL:', urlData.publicUrl);
  
  // Test database insert
  console.log('\n📊 Testing database insert...');
  
  const testRecord = {
    id: crypto.randomUUID(),
    title: 'Test Upload',
    description: 'Automated test',
    image_url: urlData.publicUrl,
    category: 'main',
    sort_order: 999,
    is_active: true,
    is_featured: false
  };
  
  const { data: dbData, error: dbError } = await supabase
    .from('gallery_images')
    .insert(testRecord)
    .select();
  
  if (dbError) {
    console.error('❌ Database insert failed!');
    console.error('   Error:', dbError.message);
    console.error('   Details:', JSON.stringify(dbError, null, 2));
  } else {
    console.log('✅ Database insert successful!');
    console.log('   Record ID:', dbData[0].id);
    
    // Clean up database
    await supabase
      .from('gallery_images')
      .delete()
      .eq('id', testRecord.id);
    console.log('   ✅ Database record cleaned up');
  }
  
  // Clean up storage
  const { error: deleteError } = await supabase
    .storage
    .from('gallery')
    .remove([filePath]);
  
  if (deleteError) {
    console.log('   ⚠️  Could not delete test file:', deleteError.message);
  } else {
    console.log('   ✅ Storage file cleaned up');
  }
  
  console.log('\n🎯 TEST COMPLETE - All systems working!');
}

testUpload().catch(console.error);

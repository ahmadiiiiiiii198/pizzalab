const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGallerySystem() {
  console.log('🧪 TESTING GALLERY UPLOAD SYSTEM...\n');

  // Test 1: Check if gallery bucket exists
  console.log('📦 Test 1: Checking storage buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
    } else {
      console.log('✅ Available buckets:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      const galleryBucket = buckets.find(b => b.name === 'gallery');
      if (galleryBucket) {
        console.log('✅ Gallery bucket exists and is', galleryBucket.public ? 'PUBLIC' : 'PRIVATE');
      } else {
        console.log('❌ Gallery bucket NOT FOUND!');
        console.log('   Available buckets:', buckets.map(b => b.name).join(', '));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n📊 Test 2: Checking gallery_images table...');
  try {
    const { data, error, count } = await supabase
      .from('gallery_images')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying gallery_images:', error.message);
    } else {
      console.log(`✅ Gallery images table exists with ${count} records`);
      if (data && data.length > 0) {
        console.log('   Sample records:');
        data.forEach((img, i) => {
          console.log(`   ${i + 1}. ID: ${img.id}`);
          console.log(`      Title: ${img.title || 'N/A'}`);
          console.log(`      URL: ${img.image_url}`);
          console.log(`      Active: ${img.is_active}`);
          console.log(`      Featured: ${img.is_featured}`);
        });
      } else {
        console.log('   ⚠️ No images found in database');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n🔐 Test 3: Checking storage permissions...');
  try {
    // Try to list files in gallery bucket
    const { data: files, error } = await supabase
      .storage
      .from('gallery')
      .list('', { limit: 10 });
    
    if (error) {
      console.error('❌ Error listing files in gallery bucket:', error.message);
      console.log('   This might be a permissions issue');
    } else {
      console.log(`✅ Can list files in gallery bucket: ${files.length} files found`);
      if (files.length > 0) {
        console.log('   Sample files:');
        files.slice(0, 5).forEach((file, i) => {
          console.log(`   ${i + 1}. ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n🧪 Test 4: Testing upload capability...');
  try {
    // Create a small test file
    const testContent = 'Test image content';
    const testFileName = `test-${Date.now()}.txt`;
    const testPath = `gallery/${testFileName}`;
    
    console.log(`   Attempting to upload: ${testPath}`);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('gallery')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('   Error details:', JSON.stringify(uploadError, null, 2));
    } else {
      console.log('✅ Upload successful!');
      console.log('   Path:', uploadData.path);
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('gallery')
        .getPublicUrl(testPath);
      
      console.log('   Public URL:', urlData.publicUrl);
      
      // Clean up test file
      const { error: deleteError } = await supabase
        .storage
        .from('gallery')
        .remove([testPath]);
      
      if (deleteError) {
        console.log('   ⚠️ Could not delete test file:', deleteError.message);
      } else {
        console.log('   ✅ Test file cleaned up');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n📋 Test 5: Checking RLS policies...');
  try {
    const { data, error } = await supabase.rpc('get_table_policies', { 
      table_name: 'gallery_images' 
    }).catch(() => ({ data: null, error: { message: 'RPC function not available' } }));
    
    if (error) {
      console.log('   ⚠️ Cannot check RLS policies:', error.message);
      console.log('   Attempting direct insert test...');
      
      // Try to insert a test record
      const testRecord = {
        id: crypto.randomUUID(),
        title: 'Test Image',
        description: 'Test',
        image_url: 'https://test.com/test.jpg',
        category: 'main',
        sort_order: 999,
        is_active: true,
        is_featured: false
      };
      
      const { error: insertError } = await supabase
        .from('gallery_images')
        .insert(testRecord);
      
      if (insertError) {
        console.error('   ❌ Cannot insert:', insertError.message);
        console.log('   This suggests RLS policies might be blocking inserts');
      } else {
        console.log('   ✅ Can insert records');
        
        // Clean up
        await supabase
          .from('gallery_images')
          .delete()
          .eq('id', testRecord.id);
        console.log('   ✅ Test record cleaned up');
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));
}

testGallerySystem().catch(console.error);

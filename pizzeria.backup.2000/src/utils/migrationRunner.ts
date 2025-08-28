import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to run storage policy fixes directly from the admin panel
 */
export const runStoragePolicyFix = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Running storage policy fix...');

    // Drop existing conflicting policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Allow public uploads to image buckets" ON storage.objects',
      'DROP POLICY IF EXISTS "Allow public reads from image buckets" ON storage.objects', 
      'DROP POLICY IF EXISTS "Allow public updates to image buckets" ON storage.objects',
      'DROP POLICY IF EXISTS "Allow public deletes from image buckets" ON storage.objects',
      'DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects',
      'DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects',
      'DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects',
      'DROP POLICY IF EXISTS "Allow public read access to storage objects" ON storage.objects'
    ];

    for (const sql of dropPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql_query: sql });
        console.log('✅ Dropped policy:', sql.split('"')[1]);
      } catch (error) {
        console.warn('⚠️ Could not drop policy (may not exist):', error);
      }
    }

    // Create new unified policies
    const createPolicies = [
      // Public read access
      `CREATE POLICY "Public read access to image buckets" ON storage.objects
       FOR SELECT USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'))`,
      
      // Allow uploads from both authenticated and anonymous users
      `CREATE POLICY "Allow uploads to image buckets" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
         (auth.role() = 'authenticated' OR auth.role() = 'anon')
       )`,
      
      // Allow updates
      `CREATE POLICY "Allow updates to image buckets" ON storage.objects
       FOR UPDATE 
       USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
              (auth.role() = 'authenticated' OR auth.role() = 'anon'))
       WITH CHECK (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
                   (auth.role() = 'authenticated' OR auth.role() = 'anon'))`,
      
      // Allow deletes
      `CREATE POLICY "Allow deletes from image buckets" ON storage.objects
       FOR DELETE USING (
         bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
         (auth.role() = 'authenticated' OR auth.role() = 'anon')
       )`
    ];

    for (const sql of createPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql_query: sql });
        console.log('✅ Created policy:', sql.split('"')[1]);
      } catch (error) {
        console.error('❌ Failed to create policy:', error);
        throw error;
      }
    }

    // Ensure buckets exist
    const buckets = ['uploads', 'admin-uploads', 'gallery', 'specialties'];
    for (const bucketName of buckets) {
      try {
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(b => b.name === bucketName);
        
        if (!bucketExists) {
          const { error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
          });
          
          if (error) {
            console.warn(`⚠️ Could not create bucket ${bucketName}:`, error);
          } else {
            console.log(`✅ Created bucket: ${bucketName}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error checking/creating bucket ${bucketName}:`, error);
      }
    }

    console.log('✅ Storage policy fix completed successfully');
    return { 
      success: true, 
      message: 'Storage policies updated successfully! Image uploads should now work.' 
    };

  } catch (error) {
    console.error('❌ Storage policy fix failed:', error);
    return { 
      success: false, 
      message: `Failed to update storage policies: ${error.message}` 
    };
  }
};

/**
 * Test storage upload functionality
 */
export const testStorageUpload = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🧪 Testing storage upload...');
    
    // Create a small test file
    const testContent = 'test-image-upload';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    const testPath = `test-uploads/test-${Date.now()}.txt`;
    
    // Try to upload
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(testPath, testFile);
    
    if (error) {
      throw error;
    }
    
    // Clean up test file
    await supabase.storage.from('uploads').remove([testPath]);
    
    console.log('✅ Storage upload test successful');
    return { 
      success: true, 
      message: 'Storage upload test passed! Upload functionality is working.' 
    };
    
  } catch (error) {
    console.error('❌ Storage upload test failed:', error);
    return { 
      success: false, 
      message: `Storage upload test failed: ${error.message}` 
    };
  }
};

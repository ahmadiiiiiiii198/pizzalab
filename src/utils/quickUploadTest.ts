import { supabase } from '@/integrations/supabase/client';
import { uploadFileUnified } from '@/services/unifiedUploadService';

/**
 * Quick Upload Test - Simple verification that upload system works
 */

export const runQuickUploadTest = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🚀 Starting Quick Upload Test...');

    // Step 1: Check database connection
    const { data: testConnection, error: connectionError } = await supabase
      .from('gallery_images')
      .select('count')
      .limit(1);

    if (connectionError) {
      return {
        success: false,
        message: `Database connection failed: ${connectionError.message}`,
        details: connectionError
      };
    }

    console.log('✅ Database connection successful');

    // Step 2: Check existing gallery images
    const { data: existingImages, error: queryError } = await supabase
      .from('gallery_images')
      .select('id, title, image_url, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      return {
        success: false,
        message: `Gallery query failed: ${queryError.message}`,
        details: queryError
      };
    }

    console.log(`✅ Found ${existingImages?.length || 0} active gallery images`);

    // Step 3: Test URL accessibility for existing images
    let accessibleUrls = 0;
    if (existingImages && existingImages.length > 0) {
      for (const image of existingImages.slice(0, 3)) { // Test first 3 images
        try {
          const response = await fetch(image.image_url, { method: 'HEAD' });
          if (response.ok) {
            accessibleUrls++;
            console.log(`✅ Image accessible: ${image.title}`);
          } else {
            console.warn(`⚠️ Image not accessible: ${image.title} (Status: ${response.status})`);
          }
        } catch (error) {
          console.warn(`⚠️ Image fetch failed: ${image.title}`, error);
        }
      }
    }

    // Step 4: Create and upload a test image
    console.log('🔄 Creating test image...');
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;
    
    // Create a simple test pattern
    ctx.fillStyle = '#10B981'; // Green
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText('QUICK', 45, 70);
    ctx.fillText('TEST', 55, 90);
    ctx.fillText(new Date().toLocaleTimeString(), 25, 110);
    
    // Convert canvas to blob properly
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 0.9);
    });

    const testFile = new File([blob], `quick-test-${Date.now()}.png`, {
      type: 'image/png',
      lastModified: Date.now()
    });

    console.log(`✅ Test image created: ${testFile.name} (${Math.round(testFile.size / 1024)}KB)`);

    // Step 5: Upload test image
    console.log('🔄 Uploading test image...');
    const uploadResult = await uploadFileUnified(testFile, {
      uploadType: 'gallery',
      saveToDatabase: true,
      metadata: {
        title: 'Quick Upload Test',
        description: 'Automated quick test upload',
        category: 'test',
        is_active: true,
        is_featured: false
      },
      maxRetries: 2,
      validateFile: true
    });

    if (!uploadResult.success) {
      return {
        success: false,
        message: `Upload failed: ${uploadResult.error}`,
        details: uploadResult
      };
    }

    console.log('✅ Upload successful');

    // Step 6: Verify database record
    if (uploadResult.databaseId) {
      const { data: newRecord, error: verifyError } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('id', uploadResult.databaseId)
        .single();

      if (verifyError) {
        return {
          success: false,
          message: `Database verification failed: ${verifyError.message}`,
          details: { uploadResult, verifyError }
        };
      }

      console.log('✅ Database record verified');

      // Step 7: Test uploaded image accessibility
      try {
        const response = await fetch(uploadResult.url!, { method: 'HEAD' });
        if (!response.ok) {
          return {
            success: false,
            message: `Uploaded image not accessible (Status: ${response.status})`,
            details: { uploadResult, response: response.status }
          };
        }
        console.log('✅ Uploaded image is accessible');
      } catch (error) {
        return {
          success: false,
          message: `Uploaded image fetch failed: ${error}`,
          details: { uploadResult, error }
        };
      }

      return {
        success: true,
        message: `Quick test passed! Upload system is working correctly.`,
        details: {
          databaseConnection: true,
          existingImages: existingImages?.length || 0,
          accessibleExistingUrls: accessibleUrls,
          uploadSuccess: true,
          databaseSync: true,
          urlAccessible: true,
          uploadedImage: {
            id: uploadResult.databaseId,
            url: uploadResult.url,
            title: newRecord.title
          }
        }
      };
    } else {
      return {
        success: false,
        message: 'Upload succeeded but no database ID returned',
        details: uploadResult
      };
    }

  } catch (error) {
    console.error('❌ Quick upload test failed:', error);
    return {
      success: false,
      message: `Test failed with error: ${error}`,
      details: error
    };
  }
};

/**
 * Check gallery images display in frontend
 */
export const checkGalleryDisplay = async (): Promise<{
  success: boolean;
  message: string;
  imageCount: number;
  details?: any;
}> => {
  try {
    // Query active gallery images
    const { data: galleryImages, error } = await supabase
      .from('gallery_images')
      .select('id, title, image_url, is_active, is_featured')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return {
        success: false,
        message: `Gallery query failed: ${error.message}`,
        imageCount: 0,
        details: error
      };
    }

    const imageCount = galleryImages?.length || 0;

    if (imageCount === 0) {
      return {
        success: true,
        message: 'No active gallery images found (this is normal for a new installation)',
        imageCount: 0
      };
    }

    // Test a few image URLs
    let accessibleCount = 0;
    const testImages = galleryImages.slice(0, Math.min(5, imageCount));
    
    for (const image of testImages) {
      try {
        const response = await fetch(image.image_url, { method: 'HEAD' });
        if (response.ok) {
          accessibleCount++;
        }
      } catch (error) {
        console.warn(`Image not accessible: ${image.title}`, error);
      }
    }

    return {
      success: true,
      message: `Gallery display check complete: ${accessibleCount}/${testImages.length} images accessible`,
      imageCount,
      details: {
        totalImages: imageCount,
        testedImages: testImages.length,
        accessibleImages: accessibleCount,
        featuredImages: galleryImages.filter(img => img.is_featured).length
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Gallery display check failed: ${error}`,
      imageCount: 0,
      details: error
    };
  }
};

/**
 * Run both quick tests
 */
export const runAllQuickTests = async () => {
  console.log('🧪 Running Quick Upload System Tests...');
  
  const uploadTest = await runQuickUploadTest();
  const displayTest = await checkGalleryDisplay();
  
  return {
    uploadTest,
    displayTest,
    overall: {
      success: uploadTest.success && displayTest.success,
      message: uploadTest.success && displayTest.success 
        ? '✅ All quick tests passed! Upload system is working correctly.'
        : '❌ Some tests failed. Check individual test results.'
    }
  };
};

import { uploadFileUnified } from '@/services/unifiedUploadService';
import { createTestImageFallback, validateFileMimeType } from './createTestImageFallback';

/**
 * Simple test to verify upload fixes
 */
export const testUploadFix = async () => {
  console.log('🧪 Testing upload fixes...');

  try {
    // Use the reliable fallback method for creating test images
    const testFile = createTestImageFallback(100, 100, 'png', 'FIX');

    // Validate the file has correct MIME type
    if (!validateFileMimeType(testFile)) {
      throw new Error(`Invalid MIME type: ${testFile.type}`);
    }

    console.log('📁 Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    // Test upload
    const result = await uploadFileUnified(testFile, {
      uploadType: 'gallery',
      saveToDatabase: true,
      metadata: {
        title: 'Upload Fix Test',
        description: 'Testing upload system fixes',
        category: 'test',
        is_active: true,
        is_featured: false
      },
      maxRetries: 2,
      validateFile: true
    });

    if (result.success) {
      console.log('✅ Upload fix test PASSED!', {
        url: result.url,
        databaseId: result.databaseId
      });
      return {
        success: true,
        message: 'Upload fix test passed successfully!',
        url: result.url,
        databaseId: result.databaseId
      };
    } else {
      console.error('❌ Upload fix test FAILED:', result.error);
      return {
        success: false,
        message: `Upload fix test failed: ${result.error}`,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ Upload fix test ERROR:', error);
    return {
      success: false,
      message: `Upload fix test error: ${error}`,
      error
    };
  }
};

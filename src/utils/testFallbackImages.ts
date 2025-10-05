import { createTestImagesFallback, validateFileMimeType } from './createTestImageFallback';

/**
 * Test the fallback image creation method
 */
export const testFallbackImageCreation = () => {
  console.log('🧪 Testing fallback image creation...');
  
  try {
    const images = createTestImagesFallback();
    
    console.log('📊 Created images:', images.map(img => ({
      name: img.name,
      type: img.type,
      size: img.size,
      lastModified: img.lastModified
    })));
    
    // Test each image
    const results = images.map(img => {
      const isValid = validateFileMimeType(img);
      const result = {
        name: img.name,
        type: img.type,
        size: img.size,
        isValid,
        isBlob: img instanceof Blob,
        isFile: img instanceof File,
        constructor: img.constructor.name
      };
      
      console.log(`🔍 Image validation:`, result);
      return result;
    });
    
    const allValid = results.every(r => r.isValid);
    
    if (allValid) {
      console.log('✅ All fallback images are valid!');
      return {
        success: true,
        message: 'All fallback images created successfully with correct MIME types',
        images: results
      };
    } else {
      console.error('❌ Some fallback images are invalid');
      return {
        success: false,
        message: 'Some fallback images have invalid MIME types',
        images: results
      };
    }
    
  } catch (error) {
    console.error('❌ Fallback image creation failed:', error);
    return {
      success: false,
      message: `Fallback image creation failed: ${error}`,
      error
    };
  }
};

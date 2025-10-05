/**
 * Fallback method for creating test images
 * Uses a more reliable approach that doesn't depend on canvas.toBlob()
 */

export const createTestImageFallback = (
  width: number = 100, 
  height: number = 100, 
  format: 'png' | 'jpeg' = 'png',
  text: string = 'TEST'
): File => {
  // Create a simple image data URL
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Draw background
  ctx.fillStyle = format === 'png' ? '#4F46E5' : '#FF6B6B';
  ctx.fillRect(0, 0, width, height);
  
  // Draw text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.floor(width / 8)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(text, width / 2, height / 2 + 5);
  
  // Convert to data URL
  const dataURL = canvas.toDataURL(`image/${format}`, 0.9);
  
  // Convert data URL to blob manually (more reliable)
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([ab], { type: mimeString });
  
  // Create file with proper metadata
  const fileName = `test-fallback-${Date.now()}.${format}`;
  const file = new File([blob], fileName, {
    type: mimeString,
    lastModified: Date.now()
  });

  console.log('✅ Fallback test image created:', {
    name: file.name,
    type: file.type,
    size: file.size,
    mimeString,
    width,
    height,
    blobType: blob.type,
    fileConstructor: file.constructor.name,
    isBlob: file instanceof Blob,
    isFile: file instanceof File
  });

  // CRITICAL: Verify the file was created correctly
  if (!file.type || file.type !== mimeString) {
    console.error(`🚨 CRITICAL: File creation failed! Expected "${mimeString}", got "${file.type}"`);
  }

  return file;
};

/**
 * Create multiple test images using fallback method
 */
export const createTestImagesFallback = (): File[] => {
  console.log('🔄 Creating test images using fallback method...');
  
  const images = [
    createTestImageFallback(100, 100, 'png', 'PNG'),
    createTestImageFallback(200, 150, 'jpeg', 'JPEG'),
    createTestImageFallback(150, 150, 'png', 'LARGE')
  ];
  
  console.log('✅ Created fallback test images:', images.map(img => ({
    name: img.name,
    type: img.type,
    size: img.size
  })));
  
  return images;
};

/**
 * Test if a file has correct MIME type
 */
export const validateFileMimeType = (file: File): boolean => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  const isValid = validTypes.includes(file.type);
  
  console.log('🔍 MIME type validation:', {
    fileName: file.name,
    fileType: file.type,
    isValid,
    validTypes
  });
  
  return isValid;
};

/**
 * Debug MIME type issues
 */

export const debugMimeTypeIssue = () => {
  console.log('🔍 Starting MIME type debug...');
  
  try {
    // Test 1: Create a simple blob
    const testData = 'test data';
    const blob1 = new Blob([testData], { type: 'image/png' });
    console.log('Test 1 - Simple blob:', {
      type: blob1.type,
      size: blob1.size,
      constructor: blob1.constructor.name
    });
    
    // Test 2: Create a File from blob
    const file1 = new File([blob1], 'test1.png', { type: 'image/png' });
    console.log('Test 2 - File from blob:', {
      name: file1.name,
      type: file1.type,
      size: file1.size,
      constructor: file1.constructor.name,
      isBlob: file1 instanceof Blob,
      isFile: file1 instanceof File
    });
    
    // Test 3: Create File directly
    const file2 = new File([testData], 'test2.png', { type: 'image/png' });
    console.log('Test 3 - Direct File creation:', {
      name: file2.name,
      type: file2.type,
      size: file2.size,
      constructor: file2.constructor.name,
      isBlob: file2 instanceof Blob,
      isFile: file2 instanceof File
    });
    
    // Test 4: Canvas to blob
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 50, 50);
    
    // Test 4a: toDataURL method
    const dataURL = canvas.toDataURL('image/png');
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob4a = new Blob([ab], { type: mimeString });
    const file4a = new File([blob4a], 'test4a.png', { type: mimeString });
    
    console.log('Test 4a - Canvas toDataURL method:', {
      dataURLStart: dataURL.substring(0, 50),
      mimeString,
      blobType: blob4a.type,
      fileName: file4a.name,
      fileType: file4a.type,
      fileSize: file4a.size
    });
    
    // Test 4b: toBlob method (async)
    canvas.toBlob((blob4b) => {
      if (blob4b) {
        const file4b = new File([blob4b], 'test4b.png', { type: blob4b.type });
        console.log('Test 4b - Canvas toBlob method:', {
          blobType: blob4b.type,
          fileName: file4b.name,
          fileType: file4b.type,
          fileSize: file4b.size
        });
      } else {
        console.error('Test 4b - toBlob failed');
      }
    }, 'image/png');
    
    // Test 5: Check browser support
    console.log('Browser support check:', {
      hasFile: typeof File !== 'undefined',
      hasBlob: typeof Blob !== 'undefined',
      hasCanvas: typeof HTMLCanvasElement !== 'undefined',
      hasToBlob: canvas.toBlob !== undefined,
      userAgent: navigator.userAgent
    });
    
    return {
      success: true,
      message: 'MIME type debug completed - check console for details'
    };
    
  } catch (error) {
    console.error('MIME type debug failed:', error);
    return {
      success: false,
      message: `MIME type debug failed: ${error}`,
      error
    };
  }
};

import { supabase } from '@/integrations/supabase/client';
import { uploadFileUnified } from '@/services/unifiedUploadService';
import { validateImageUrl, generatePublicUrl } from '@/utils/urlUtils';
import { classifyUploadError } from '@/utils/uploadErrorHandler';
import { createTestImagesFallback, validateFileMimeType } from './createTestImageFallback';

/**
 * Comprehensive Upload System Test Suite
 * Tests all aspects of the upload system
 */

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

/**
 * Create test image files of different types and sizes
 */
export const createTestImages = async (): Promise<File[]> => {
  // Force use of fallback method for now to ensure reliability
  console.log('🔄 Using reliable fallback method for test image creation...');

  const fallbackImages = createTestImagesFallback();

  // Validate all fallback images
  const allValid = fallbackImages.every(img => {
    const isValid = validateFileMimeType(img);
    console.log(`🔍 Validating ${img.name}: type=${img.type}, valid=${isValid}`);
    return isValid;
  });

  if (!allValid) {
    throw new Error('Fallback image creation failed MIME type validation');
  }

  console.log('✅ All fallback test images validated successfully');
  return fallbackImages;

  /* Temporarily disabled canvas.toBlob() method due to MIME type issues
  const images: File[] = [];

  try {
    console.log('🔄 Attempting to create test images using canvas.toBlob()...');

  // Test 1: Small PNG
  const canvas1 = document.createElement('canvas');
  canvas1.width = 100;
  canvas1.height = 100;
  const ctx1 = canvas1.getContext('2d')!;
  ctx1.fillStyle = '#FF6B6B';
  ctx1.fillRect(0, 0, 100, 100);
  ctx1.fillStyle = '#FFFFFF';
  ctx1.font = '12px Arial';
  ctx1.fillText('PNG', 35, 55);
  
  const blob1 = await new Promise<Blob>((resolve, reject) => {
    canvas1.toBlob((blob) => {
      if (blob) {
        console.log('✅ PNG blob created:', { type: blob.type, size: blob.size });
        resolve(blob);
      } else {
        reject(new Error('Failed to create PNG blob'));
      }
    }, 'image/png', 0.9);
  });

  const file1 = new File([blob1], 'test-small.png', {
    type: 'image/png',
    lastModified: Date.now()
  });
  console.log('✅ PNG file created:', { type: file1.type, size: file1.size, name: file1.name });
  images.push(file1);

  // Test 2: Medium JPEG
  const canvas2 = document.createElement('canvas');
  canvas2.width = 500;
  canvas2.height = 300;
  const ctx2 = canvas2.getContext('2d')!;
  ctx2.fillStyle = '#4ECDC4';
  ctx2.fillRect(0, 0, 500, 300);
  ctx2.fillStyle = '#FFFFFF';
  ctx2.font = '24px Arial';
  ctx2.fillText('JPEG TEST', 180, 160);
  
  const blob2 = await new Promise<Blob>((resolve, reject) => {
    canvas2.toBlob((blob) => {
      if (blob) {
        console.log('✅ JPEG blob created:', { type: blob.type, size: blob.size });
        resolve(blob);
      } else {
        reject(new Error('Failed to create JPEG blob'));
      }
    }, 'image/jpeg', 0.8);
  });

  const file2 = new File([blob2], 'test-medium.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
  console.log('✅ JPEG file created:', { type: file2.type, size: file2.size, name: file2.name });
  images.push(file2);

  // Test 3: Large WebP
  const canvas3 = document.createElement('canvas');
  canvas3.width = 800;
  canvas3.height = 600;
  const ctx3 = canvas3.getContext('2d')!;
  
  // Create gradient
  const gradient = ctx3.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx3.fillStyle = gradient;
  ctx3.fillRect(0, 0, 800, 600);
  
  ctx3.fillStyle = '#FFFFFF';
  ctx3.font = '32px Arial';
  ctx3.fillText('WEBP LARGE TEST', 250, 320);
  
  const blob3 = await new Promise<Blob>((resolve, reject) => {
    canvas3.toBlob((blob) => {
      if (blob) {
        console.log('✅ WebP blob created:', { type: blob.type, size: blob.size });
        resolve(blob);
      } else {
        // WebP might not be supported, fallback to PNG
        console.warn('⚠️ WebP not supported, falling back to PNG');
        canvas3.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error('Failed to create WebP or PNG blob'));
          }
        }, 'image/png', 0.9);
      }
    }, 'image/webp', 0.9);
  });

  const file3 = new File([blob3], 'test-large.webp', {
    type: blob3.type, // Use actual blob type (might be PNG if WebP failed)
    lastModified: Date.now()
  });
  console.log('✅ WebP/PNG file created:', { type: file3.type, size: file3.size, name: file3.name });
  images.push(file3);

    // Validate all created files
    const allValid = images.every(img => validateFileMimeType(img));
    if (!allValid) {
      console.warn('⚠️ Some images have invalid MIME types, using fallback method');
      throw new Error('Invalid MIME types detected');
    }

    console.log('✅ All test images created successfully with canvas.toBlob()');
    return images;

  } catch (error) {
    console.warn('⚠️ Canvas.toBlob() method failed, using fallback method:', error);

    // Use fallback method
    const fallbackImages = createTestImagesFallback();

    // Validate fallback images
    const allFallbackValid = fallbackImages.every(img => validateFileMimeType(img));
    if (!allFallbackValid) {
      throw new Error('Both primary and fallback image creation methods failed');
    }

    console.log('✅ Fallback test images created successfully');
    return fallbackImages;
  }
  */ // End of commented canvas.toBlob() method
};

/**
 * Test 1: Storage Upload Tests
 */
export const runStorageUploadTests = async (): Promise<TestSuite> => {
  const startTime = Date.now();
  const results: TestResult[] = [];
  const testImages = await createTestImages();

  console.log('🚀 Starting Storage Upload Tests...');

  for (const [index, testImage] of testImages.entries()) {
    const testStart = Date.now();

    // Log file details before upload
    console.log(`🔍 Pre-upload file inspection for ${testImage.name}:`, {
      name: testImage.name,
      type: testImage.type,
      size: testImage.size,
      lastModified: testImage.lastModified,
      constructor: testImage.constructor.name,
      isBlob: testImage instanceof Blob,
      isFile: testImage instanceof File
    });

    // CRITICAL: Test if file is corrupted
    if (!testImage.type || testImage.type === 'application/json') {
      console.error(`🚨 CRITICAL: File ${testImage.name} has invalid MIME type: "${testImage.type}"`);
      console.error(`🚨 This indicates the file creation process is corrupted!`);
    }

    try {
      console.log(`🔄 Calling uploadFileUnified for ${testImage.name}...`);
      const uploadResult = await uploadFileUnified(testImage, {
        uploadType: 'gallery',
        saveToDatabase: false, // Test storage only
        validateFile: true,
        maxRetries: 2
      });
      console.log(`📤 Upload result for ${testImage.name}:`, uploadResult);

      const duration = Date.now() - testStart;

      if (uploadResult.success && uploadResult.url) {
        results.push({
          testName: `Storage Upload ${index + 1} (${testImage.name})`,
          passed: true,
          message: `Successfully uploaded ${testImage.name} (${Math.round(testImage.size / 1024)}KB)`,
          details: {
            url: uploadResult.url,
            filePath: uploadResult.filePath,
            fileSize: testImage.size,
            mimeType: testImage.type
          },
          duration
        });
      } else {
        results.push({
          testName: `Storage Upload ${index + 1} (${testImage.name})`,
          passed: false,
          message: `Upload failed: ${uploadResult.error}`,
          details: uploadResult,
          duration
        });
      }
    } catch (error) {
      results.push({
        testName: `Storage Upload ${index + 1} (${testImage.name})`,
        passed: false,
        message: `Upload threw error: ${error}`,
        details: error,
        duration: Date.now() - testStart
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;

  return {
    suiteName: 'Storage Upload Tests',
    results,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    duration: totalDuration
  };
};

/**
 * Test 2: Database Synchronization Tests
 */
export const runDatabaseSyncTests = async (): Promise<TestSuite> => {
  const startTime = Date.now();
  const results: TestResult[] = [];
  const testImages = (await createTestImages()).slice(0, 2); // Test with 2 images

  console.log('🚀 Starting Database Sync Tests...');

  for (const [index, testImage] of testImages.entries()) {
    const testStart = Date.now();
    
    try {
      // Upload with database sync enabled
      const uploadResult = await uploadFileUnified(testImage, {
        uploadType: 'gallery',
        saveToDatabase: true,
        metadata: {
          title: `Test Upload ${index + 1}`,
          description: `Automated test upload of ${testImage.name}`,
          category: 'test',
          is_active: true,
          is_featured: false
        },
        validateFile: true,
        maxRetries: 2
      });

      const duration = Date.now() - testStart;

      if (uploadResult.success && uploadResult.databaseId) {
        // Verify database record exists
        const { data: dbRecord, error: dbError } = await supabase
          .from('gallery_images')
          .select('*')
          .eq('id', uploadResult.databaseId)
          .single();

        if (dbError) {
          results.push({
            testName: `Database Sync ${index + 1} (${testImage.name})`,
            passed: false,
            message: `Database verification failed: ${dbError.message}`,
            details: { uploadResult, dbError },
            duration
          });
        } else if (dbRecord && dbRecord.image_url === uploadResult.url) {
          results.push({
            testName: `Database Sync ${index + 1} (${testImage.name})`,
            passed: true,
            message: `Successfully synced to database with correct URL`,
            details: { uploadResult, dbRecord },
            duration
          });
        } else {
          results.push({
            testName: `Database Sync ${index + 1} (${testImage.name})`,
            passed: false,
            message: `Database record found but URL mismatch`,
            details: { uploadResult, dbRecord },
            duration
          });
        }
      } else {
        results.push({
          testName: `Database Sync ${index + 1} (${testImage.name})`,
          passed: false,
          message: `Upload failed or no database ID returned: ${uploadResult.error}`,
          details: uploadResult,
          duration
        });
      }
    } catch (error) {
      results.push({
        testName: `Database Sync ${index + 1} (${testImage.name})`,
        passed: false,
        message: `Test threw error: ${error}`,
        details: error,
        duration: Date.now() - testStart
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;

  return {
    suiteName: 'Database Synchronization Tests',
    results,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    duration: totalDuration
  };
};

/**
 * Test 3: URL Accessibility Tests
 */
export const runUrlAccessibilityTests = async (): Promise<TestSuite> => {
  const startTime = Date.now();
  const results: TestResult[] = [];

  console.log('🚀 Starting URL Accessibility Tests...');

  // Get some recent gallery images to test
  const { data: recentImages, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, title')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !recentImages || recentImages.length === 0) {
    results.push({
      testName: 'URL Accessibility Setup',
      passed: false,
      message: 'No gallery images found to test URL accessibility',
      details: error
    });
  } else {
    for (const [index, image] of recentImages.entries()) {
      const testStart = Date.now();
      
      try {
        // Test URL validation
        const validatedUrl = validateImageUrl(image.image_url);
        const isValidUrl = validatedUrl === image.image_url;

        // Test HTTP accessibility
        const response = await fetch(image.image_url, { method: 'HEAD' });
        const isAccessible = response.ok;

        // Test image loading
        const canLoad = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = image.image_url;
          
          // Timeout after 10 seconds
          setTimeout(() => resolve(false), 10000);
        });

        const duration = Date.now() - testStart;

        if (isValidUrl && isAccessible && canLoad) {
          results.push({
            testName: `URL Accessibility ${index + 1} (${image.title})`,
            passed: true,
            message: `URL is valid, accessible, and loads correctly`,
            details: {
              url: image.image_url,
              httpStatus: response.status,
              contentType: response.headers.get('content-type'),
              contentLength: response.headers.get('content-length')
            },
            duration
          });
        } else {
          results.push({
            testName: `URL Accessibility ${index + 1} (${image.title})`,
            passed: false,
            message: `URL issues: Valid=${isValidUrl}, Accessible=${isAccessible}, CanLoad=${canLoad}`,
            details: {
              url: image.image_url,
              httpStatus: response.status,
              isValidUrl,
              isAccessible,
              canLoad
            },
            duration
          });
        }
      } catch (error) {
        results.push({
          testName: `URL Accessibility ${index + 1} (${image.title})`,
          passed: false,
          message: `URL test threw error: ${error}`,
          details: { url: image.image_url, error },
          duration: Date.now() - testStart
        });
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;

  return {
    suiteName: 'URL Accessibility Tests',
    results,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    duration: totalDuration
  };
};

/**
 * Test 4: Error Handling Tests
 */
export const runErrorHandlingTests = async (): Promise<TestSuite> => {
  const startTime = Date.now();
  const results: TestResult[] = [];

  console.log('🚀 Starting Error Handling Tests...');

  // Test 1: Invalid file type
  try {
    const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
    const result = await uploadFileUnified(invalidFile, {
      uploadType: 'gallery',
      saveToDatabase: false,
      validateFile: true
    });

    results.push({
      testName: 'Invalid File Type Handling',
      passed: !result.success,
      message: result.success ? 'Should have rejected invalid file type' : `Correctly rejected: ${result.error}`,
      details: result
    });
  } catch (error) {
    results.push({
      testName: 'Invalid File Type Handling',
      passed: true,
      message: 'Correctly threw error for invalid file type',
      details: error
    });
  }

  // Test 2: Invalid upload type
  try {
    const testImages = await createTestImages();
    const testImage = testImages[0];
    const result = await uploadFileUnified(testImage, {
      uploadType: 'invalid-type',
      saveToDatabase: false,
      validateFile: false
    });

    results.push({
      testName: 'Invalid Upload Type Handling',
      passed: !result.success,
      message: result.success ? 'Should have rejected invalid upload type' : `Correctly rejected: ${result.error}`,
      details: result
    });
  } catch (error) {
    results.push({
      testName: 'Invalid Upload Type Handling',
      passed: true,
      message: 'Correctly threw error for invalid upload type',
      details: error
    });
  }

  // Test 3: Error classification
  const testError = new Error('Test storage error: bucket not found');
  const classifiedError = classifyUploadError(testError);
  
  results.push({
    testName: 'Error Classification',
    passed: classifiedError.type === 'storage' && !classifiedError.retryable,
    message: `Classified as: ${classifiedError.type}, retryable: ${classifiedError.retryable}`,
    details: classifiedError
  });

  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;

  return {
    suiteName: 'Error Handling Tests',
    results,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    duration: totalDuration
  };
};

/**
 * Run all test suites
 */
export const runAllUploadTests = async (): Promise<{
  suites: TestSuite[];
  summary: {
    totalSuites: number;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
    successRate: number;
  };
}> => {
  console.log('🧪 Starting Comprehensive Upload System Tests...');
  const overallStart = Date.now();

  const suites: TestSuite[] = [];

  // Run all test suites
  suites.push(await runStorageUploadTests());
  suites.push(await runDatabaseSyncTests());
  suites.push(await runUrlAccessibilityTests());
  suites.push(await runErrorHandlingTests());

  const totalDuration = Date.now() - overallStart;
  const totalTests = suites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = suites.reduce((sum, suite) => sum + suite.passedTests, 0);
  const totalFailed = suites.reduce((sum, suite) => sum + suite.failedTests, 0);
  const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  console.log(`✅ Upload System Tests Complete: ${totalPassed}/${totalTests} passed (${successRate.toFixed(1)}%)`);

  // Log detailed results for debugging
  console.log('📊 Detailed Test Results:');
  suites.forEach(suite => {
    console.log(`\n🧪 ${suite.suiteName}: ${suite.passedTests}/${suite.totalTests} passed`);
    suite.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.testName}: ${result.message}`);
      if (!result.passed && result.details) {
        console.log(`    Details:`, result.details);
      }
    });
  });

  return {
    suites,
    summary: {
      totalSuites: suites.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      successRate
    }
  };
};

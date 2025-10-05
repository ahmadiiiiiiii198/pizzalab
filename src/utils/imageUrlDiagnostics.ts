import { supabase } from '@/integrations/supabase/client';

/**
 * Image URL Diagnostics
 * Diagnose and fix image loading issues
 */

export interface ImageDiagnosticResult {
  url: string;
  accessible: boolean;
  httpStatus?: number;
  contentType?: string;
  contentLength?: string;
  error?: string;
  corsHeaders?: Record<string, string>;
}

export interface BucketDiagnostic {
  bucketName: string;
  exists: boolean;
  isPublic: boolean;
  sampleFiles: string[];
  error?: string;
}

/**
 * Test a specific image URL for accessibility
 */
export const testImageUrl = async (url: string): Promise<ImageDiagnosticResult> => {
  try {
    console.log(`🔍 Testing URL: ${url}`);

    // Test with fetch (HEAD request)
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors' // Test CORS explicitly
    });

    const result: ImageDiagnosticResult = {
      url,
      accessible: response.ok,
      httpStatus: response.status,
      contentType: response.headers.get('content-type') || undefined,
      contentLength: response.headers.get('content-length') || undefined,
      corsHeaders: {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin') || 'not set',
        'access-control-allow-methods': response.headers.get('access-control-allow-methods') || 'not set',
        'access-control-allow-headers': response.headers.get('access-control-allow-headers') || 'not set'
      }
    };

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }

    return result;

  } catch (error) {
    return {
      url,
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test image loading in browser (actual image element)
 */
export const testImageLoading = async (url: string): Promise<{
  canLoad: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  error?: string;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        canLoad: true,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
    };
    
    img.onerror = (error) => {
      resolve({
        canLoad: false,
        error: 'Image failed to load in browser'
      });
    };
    
    // Set timeout
    setTimeout(() => {
      resolve({
        canLoad: false,
        error: 'Image loading timeout (10s)'
      });
    }, 10000);
    
    img.src = url;
  });
};

/**
 * Diagnose Supabase storage buckets
 */
export const diagnoseBuckets = async (): Promise<BucketDiagnostic[]> => {
  const buckets = ['uploads', 'gallery', 'admin-uploads', 'specialties'];
  const results: BucketDiagnostic[] = [];

  for (const bucketName of buckets) {
    try {
      console.log(`🔍 Diagnosing bucket: ${bucketName}`);

      // List files in bucket
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 5 });

      if (error) {
        results.push({
          bucketName,
          exists: false,
          isPublic: false,
          sampleFiles: [],
          error: error.message
        });
        continue;
      }

      // Test public access with a sample file
      let isPublic = false;
      const sampleFiles = files?.map(f => f.name) || [];
      
      if (files && files.length > 0) {
        const testFile = files[0];
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(testFile.name);
        
        if (publicUrlData?.publicUrl) {
          const testResult = await testImageUrl(publicUrlData.publicUrl);
          isPublic = testResult.accessible;
        }
      }

      results.push({
        bucketName,
        exists: true,
        isPublic,
        sampleFiles
      });

    } catch (error) {
      results.push({
        bucketName,
        exists: false,
        isPublic: false,
        sampleFiles: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
};

/**
 * Test the specific failing URLs from the console
 */
export const testFailingUrls = async (): Promise<{
  results: Array<{
    url: string;
    fetchTest: ImageDiagnosticResult;
    imageTest: Awaited<ReturnType<typeof testImageLoading>>;
  }>;
  summary: {
    totalTested: number;
    accessible: number;
    canLoad: number;
    commonIssues: string[];
  };
}> => {
  const failingUrls = [
    'https://foymsziaullphulzhmxy.supabase.co/storage/v1/object/public/uploads/section-backgrounds/section-bg-1756641301658-jfrk6fns3tk.jpg',
    'https://foymsziaullphulzhmxy.supabase.co/storage/v1/object/public/uploads/section-backgrounds/section-bg-1756641566092-y042s1dozaq.jpg'
  ];

  const workingUrl = 'https://foymsziaullphulzhmxy.supabase.co/storage/v1/object/public/uploads/hero-backgrounds/1756344220582-hkku862dx1d.jpg';
  
  // Add working URL for comparison
  const testUrls = [...failingUrls, workingUrl];

  const results = [];
  let accessible = 0;
  let canLoad = 0;
  const commonIssues: string[] = [];

  for (const url of testUrls) {
    console.log(`🧪 Testing URL: ${url.substring(0, 80)}...`);
    
    const fetchTest = await testImageUrl(url);
    const imageTest = await testImageLoading(url);
    
    if (fetchTest.accessible) accessible++;
    if (imageTest.canLoad) canLoad++;
    
    if (!fetchTest.accessible && fetchTest.error) {
      commonIssues.push(fetchTest.error);
    }
    
    if (!imageTest.canLoad && imageTest.error) {
      commonIssues.push(imageTest.error);
    }

    results.push({
      url,
      fetchTest,
      imageTest
    });
  }

  return {
    results,
    summary: {
      totalTested: testUrls.length,
      accessible,
      canLoad,
      commonIssues: [...new Set(commonIssues)] // Remove duplicates
    }
  };
};

/**
 * Check if files exist in storage but URLs are wrong
 */
export const checkStorageFiles = async (): Promise<{
  sectionBackgrounds: string[];
  heroBackgrounds: string[];
  issues: string[];
}> => {
  const issues: string[] = [];
  let sectionBackgrounds: string[] = [];
  let heroBackgrounds: string[] = [];

  try {
    // Check section-backgrounds folder
    const { data: sectionFiles, error: sectionError } = await supabase.storage
      .from('uploads')
      .list('section-backgrounds', { limit: 10 });

    if (sectionError) {
      issues.push(`Section backgrounds error: ${sectionError.message}`);
    } else {
      sectionBackgrounds = sectionFiles?.map(f => f.name) || [];
    }

    // Check hero-backgrounds folder
    const { data: heroFiles, error: heroError } = await supabase.storage
      .from('uploads')
      .list('hero-backgrounds', { limit: 10 });

    if (heroError) {
      issues.push(`Hero backgrounds error: ${heroError.message}`);
    } else {
      heroBackgrounds = heroFiles?.map(f => f.name) || [];
    }

  } catch (error) {
    issues.push(`Storage check error: ${error}`);
  }

  return {
    sectionBackgrounds,
    heroBackgrounds,
    issues
  };
};

/**
 * Run comprehensive image diagnostics
 */
export const runImageDiagnostics = async () => {
  console.log('🔍 Starting comprehensive image diagnostics...');

  const results = {
    timestamp: new Date().toISOString(),
    bucketDiagnostics: await diagnoseBuckets(),
    urlTests: await testFailingUrls(),
    storageFiles: await checkStorageFiles()
  };

  console.log('📊 Diagnostics complete:', results);
  return results;
};

/**
 * Quick fix: Regenerate URLs for problematic images
 */
export const regenerateProblematicUrls = async (): Promise<{
  fixed: Array<{ oldUrl: string; newUrl: string; }>;
  errors: string[];
}> => {
  const fixed: Array<{ oldUrl: string; newUrl: string; }> = [];
  const errors: string[] = [];

  try {
    // Get all settings that might contain image URLs
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', '%Content');

    if (error) {
      errors.push(`Failed to fetch settings: ${error.message}`);
      return { fixed, errors };
    }

    for (const setting of settings || []) {
      try {
        const content = setting.value as any;
        if (content && typeof content === 'object' && content.backgroundImage) {
          const oldUrl = content.backgroundImage;
          
          // Check if URL is problematic
          const testResult = await testImageUrl(oldUrl);
          if (!testResult.accessible) {
            // Try to extract file path and regenerate URL
            const urlParts = oldUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const folder = urlParts[urlParts.length - 2];
            
            if (fileName && folder) {
              const { data: newUrlData } = supabase.storage
                .from('uploads')
                .getPublicUrl(`${folder}/${fileName}`);
              
              if (newUrlData?.publicUrl) {
                // Test new URL
                const newTestResult = await testImageUrl(newUrlData.publicUrl);
                if (newTestResult.accessible) {
                  // Update the setting
                  const updatedContent = {
                    ...content,
                    backgroundImage: newUrlData.publicUrl
                  };
                  
                  const { error: updateError } = await supabase
                    .from('settings')
                    .update({ value: updatedContent })
                    .eq('key', setting.key);
                  
                  if (!updateError) {
                    fixed.push({
                      oldUrl,
                      newUrl: newUrlData.publicUrl
                    });
                  } else {
                    errors.push(`Failed to update ${setting.key}: ${updateError.message}`);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        errors.push(`Error processing ${setting.key}: ${error}`);
      }
    }

  } catch (error) {
    errors.push(`General error: ${error}`);
  }

  return { fixed, errors };
};

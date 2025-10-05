import { supabase } from '@/integrations/supabase/client';
import { getPublicUrlPattern } from '@/config/storageConfig';

/**
 * Utility functions for consistent URL generation and handling
 */

export interface UrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generate a public URL for a file in Supabase storage
 * FIXED: Enhanced validation and error handling
 */
export const generatePublicUrl = (bucketName: string, filePath: string): UrlResult => {
  try {
    // Enhanced validation
    if (!bucketName || typeof bucketName !== 'string' || bucketName.trim() === '') {
      return {
        success: false,
        error: 'Valid bucket name is required'
      };
    }

    if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
      return {
        success: false,
        error: 'Valid file path is required'
      };
    }

    // Clean inputs
    const cleanBucket = bucketName.trim();
    const cleanPath = filePath.trim();

    console.log(`🔗 [UrlUtils] Generating public URL for bucket: ${cleanBucket}, path: ${cleanPath}`);

    // Use Supabase client to generate public URL
    const { data } = supabase.storage
      .from(cleanBucket)
      .getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate public URL - no URL returned from Supabase'
      };
    }

    // Validate the generated URL
    const generatedUrl = data.publicUrl;
    if (!isValidUrl(generatedUrl)) {
      return {
        success: false,
        error: 'Generated URL is not valid'
      };
    }

    console.log(`✅ [UrlUtils] Generated valid public URL: ${generatedUrl.substring(0, 50)}...`);

    return {
      success: true,
      url: generatedUrl
    };

  } catch (error) {
    console.error('❌ [UrlUtils] Error generating public URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'URL generation error'
    };
  }
};

/**
 * Validate if a URL is a valid Supabase storage URL
 */
export const isValidStorageUrl = (url: string): boolean => {
  try {
    if (!url) return false;
    
    // Check if it's a Supabase storage URL pattern
    const supabasePattern = /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//;
    return supabasePattern.test(url);
    
  } catch (error) {
    console.error('❌ [UrlUtils] Error validating storage URL:', error);
    return false;
  }
};

/**
 * Extract bucket and file path from a Supabase storage URL
 */
export const parseStorageUrl = (url: string): { bucket?: string; filePath?: string; error?: string } => {
  try {
    if (!isValidStorageUrl(url)) {
      return { error: 'Invalid storage URL format' };
    }

    // Extract bucket and file path from URL
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    
    if (!match) {
      return { error: 'Could not parse storage URL' };
    }

    return {
      bucket: match[1],
      filePath: match[2]
    };

  } catch (error) {
    console.error('❌ [UrlUtils] Error parsing storage URL:', error);
    return { error: error instanceof Error ? error.message : 'URL parsing error' };
  }
};

/**
 * Check if a URL is accessible (returns 200 status)
 */
export const checkUrlAccessibility = async (url: string): Promise<{ accessible: boolean; error?: string }> => {
  try {
    if (!url) {
      return { accessible: false, error: 'No URL provided' };
    }

    // Use fetch with HEAD method to check if URL is accessible
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    });

    return { accessible: response.ok };

  } catch (error) {
    console.warn('⚠️ [UrlUtils] URL accessibility check failed:', error);
    // Don't treat network errors as inaccessible - might be CORS or network issues
    return { accessible: true, error: 'Could not verify accessibility' };
  }
};

/**
 * Generate a thumbnail URL for an image (if supported)
 */
export const generateThumbnailUrl = (originalUrl: string, width: number = 300, height: number = 300): string => {
  try {
    // For now, return the original URL
    // In the future, this could integrate with image transformation services
    return originalUrl;
    
  } catch (error) {
    console.error('❌ [UrlUtils] Error generating thumbnail URL:', error);
    return originalUrl;
  }
};

/**
 * Sanitize a filename for use in URLs
 */
export const sanitizeFilename = (filename: string): string => {
  try {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_') // Replace non-alphanumeric chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
  } catch (error) {
    console.error('❌ [UrlUtils] Error sanitizing filename:', error);
    return 'file';
  }
};

/**
 * Generate a unique filename with timestamp and random suffix
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  try {
    const extension = originalFilename.split('.').pop() || 'jpg';
    const baseName = originalFilename.replace(/\.[^/.]+$/, ''); // Remove extension
    const sanitizedBaseName = sanitizeFilename(baseName);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${sanitizedBaseName}_${timestamp}_${randomSuffix}.${extension}`;
    
  } catch (error) {
    console.error('❌ [UrlUtils] Error generating unique filename:', error);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `file_${timestamp}_${randomSuffix}.jpg`;
  }
};

/**
 * Convert blob URL to data URL (for temporary display)
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Check if URL is a blob URL
 */
export const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

/**
 * Check if URL is a data URL
 */
export const isDataUrl = (url: string): boolean => {
  return url.startsWith('data:');
};

/**
 * Get file extension from URL
 */
export const getFileExtensionFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop();
    return extension || '';
  } catch (error) {
    console.error('❌ [UrlUtils] Error getting file extension from URL:', error);
    return '';
  }
};

/**
 * Enhanced URL validation
 * FIXED: More comprehensive validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return false;
    }

    // Check for blob URLs (invalid for storage)
    if (isBlobUrl(url)) {
      return false;
    }

    // Try to create URL object
    const urlObj = new URL(url);

    // Must be http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Must have a valid hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Validate image URL and provide fallback
 * FIXED: Enhanced validation with better error handling
 */
export const validateImageUrl = (url: string, fallbackUrl: string = '/placeholder.svg'): string => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('⚠️ [UrlUtils] Empty or invalid URL provided, using fallback');
      return fallbackUrl;
    }

    const cleanUrl = url.trim();

    if (isBlobUrl(cleanUrl)) {
      console.warn('⚠️ [UrlUtils] Blob URL detected, using fallback:', cleanUrl.substring(0, 50));
      return fallbackUrl;
    }

    if (!isValidUrl(cleanUrl)) {
      console.warn('⚠️ [UrlUtils] Invalid URL format, using fallback:', cleanUrl.substring(0, 50));
      return fallbackUrl;
    }

    return cleanUrl;

  } catch (error) {
    console.error('❌ [UrlUtils] Error validating image URL:', error);
    return fallbackUrl;
  }
};

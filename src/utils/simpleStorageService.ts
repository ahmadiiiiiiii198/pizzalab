import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { getStorageConfig, isValidBucket, getAcceptedFileTypes, getMaxFileSize } from '@/config/storageConfig';
import { generatePublicUrl, generateUniqueFilename } from '@/utils/urlUtils';

/**
 * Simplified storage service that works with the unified RLS policies
 * This service doesn't require complex authentication and relies on the 
 * unified storage policies that allow both authenticated and anonymous uploads
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  filePath?: string;
}

/**
 * Upload a file using upload type configuration
 */
export const uploadFileByType = async (
  file: File,
  uploadType: string
): Promise<UploadResult> => {
  try {
    // Get storage configuration for this upload type
    const config = getStorageConfig(uploadType);

    // Validate file type
    const acceptedTypes = getAcceptedFileTypes(uploadType);
    if (!acceptedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} not allowed for ${uploadType}. Accepted types: ${acceptedTypes.join(', ')}`
      };
    }

    // Validate file size
    const maxSize = getMaxFileSize(uploadType);
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        success: false,
        error: `File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum ${maxSizeMB}MB for ${uploadType}`
      };
    }

    // Upload using the configured bucket and folder
    return await uploadFileToStorage(file, config.bucket, config.folder);

  } catch (error) {
    console.error('❌ [SimpleStorage] Error in uploadFileByType:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload configuration error'
    };
  }
};

/**
 * Upload a file to Supabase storage with simplified error handling
 */
export const uploadFileToStorage = async (
  file: File,
  bucketName: string = 'gallery',
  folderPath?: string
): Promise<UploadResult> => {
  try {
    console.log(`📤 [SimpleStorage] Starting upload to bucket: ${bucketName}`);
    
    // Generate unique file path using URL utilities
    const fileName = generateUniqueFilename(file.name);
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    console.log(`📤 [SimpleStorage] File path: ${filePath}`);

    // Validate bucket name
    if (!isValidBucket(bucketName)) {
      console.warn(`⚠️ [SimpleStorage] Invalid bucket name: ${bucketName}`);
      return {
        success: false,
        error: `Invalid storage bucket '${bucketName}'. Please use a valid bucket name.`
      };
    }

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.warn('⚠️ [SimpleStorage] Could not list buckets:', bucketsError);
      // Continue anyway - bucket might exist
    } else {
      const bucketExists = buckets?.some(b => b.name === bucketName);
      if (!bucketExists) {
        console.warn(`⚠️ [SimpleStorage] Bucket ${bucketName} does not exist`);
        return {
          success: false,
          error: `Storage bucket '${bucketName}' does not exist. Please contact administrator.`
        };
      }
    }

    // Upload the file
    console.log(`📤 [SimpleStorage] Uploading file: ${file.name} (${file.size} bytes)`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true // Allow overwriting
      });

    if (error) {
      console.error('❌ [SimpleStorage] Upload failed:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('row level security policy')) {
        return { 
          success: false, 
          error: 'Storage permissions error. Please contact administrator to configure storage policies.' 
        };
      }
      
      if (error.message.includes('not found')) {
        return { 
          success: false, 
          error: `Storage bucket '${bucketName}' not found. Please contact administrator.` 
        };
      }
      
      return { 
        success: false, 
        error: `Upload failed: ${error.message}` 
      };
    }

    if (!data) {
      return { 
        success: false, 
        error: 'Upload completed but no data returned from storage service' 
      };
    }

    // Get the public URL using consistent URL generation
    const urlResult = generatePublicUrl(bucketName, filePath);

    if (!urlResult.success || !urlResult.url) {
      return {
        success: false,
        error: urlResult.error || 'Failed to generate public URL'
      };
    }

    const publicUrl = urlResult.url;
    
    console.log(`✅ [SimpleStorage] Upload successful: ${publicUrl}`);
    
    return {
      success: true,
      url: publicUrl,
      filePath: filePath
    };

  } catch (error) {
    console.error('❌ [SimpleStorage] Unexpected error during upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected upload error'
    };
  }
};

/**
 * Delete a file from Supabase storage
 */
export const deleteFileFromStorage = async (
  bucketName: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🗑️ [SimpleStorage] Deleting file: ${bucketName}/${filePath}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('❌ [SimpleStorage] Delete failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [SimpleStorage] File deleted successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ [SimpleStorage] Unexpected error during delete:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected delete error'
    };
  }
};

/**
 * Get the public URL for a file in storage
 */
export const getPublicUrl = (bucketName: string, filePath: string): string => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * List files in a storage bucket folder
 */
export const listFilesInStorage = async (
  bucketName: string,
  folderPath?: string
): Promise<{ success: boolean; files?: any[]; error?: string }> => {
  try {
    console.log(`📋 [SimpleStorage] Listing files in: ${bucketName}/${folderPath || ''}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (error) {
      console.error('❌ [SimpleStorage] List failed:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [SimpleStorage] Found ${data?.length || 0} files`);
    return { success: true, files: data || [] };

  } catch (error) {
    console.error('❌ [SimpleStorage] Unexpected error during list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected list error'
    };
  }
};

/**
 * Upload multiple files to storage
 */
export const uploadMultipleFilesToStorage = async (
  files: File[],
  bucketName: string = 'gallery',
  folderPath?: string
): Promise<{ success: boolean; results: UploadResult[]; error?: string }> => {
  try {
    console.log(`📤 [SimpleStorage] Uploading ${files.length} files to ${bucketName}`);
    
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadFileToStorage(file, bucketName, folderPath);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ [SimpleStorage] Upload complete: ${successCount} success, ${failureCount} failed`);
    
    return {
      success: failureCount === 0,
      results,
      error: failureCount > 0 ? `${failureCount} uploads failed` : undefined
    };
    
  } catch (error) {
    console.error('❌ [SimpleStorage] Unexpected error during multiple upload:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unexpected multiple upload error'
    };
  }
};

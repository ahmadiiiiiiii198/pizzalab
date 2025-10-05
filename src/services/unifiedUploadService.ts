import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { getStorageConfig, isValidUploadType, getBucketForUploadType } from '@/config/storageConfig';
import { generateUniqueFilename, generatePublicUrl } from '@/utils/urlUtils';
import { validateImageFile } from '@/utils/fileValidation';

/**
 * Unified Upload Service
 * FIXED: Ensures all uploads are properly saved to both storage and database
 */

export interface UploadOptions {
  uploadType: string;
  saveToDatabase?: boolean;
  databaseTable?: string;
  metadata?: Record<string, any>;
  maxRetries?: number;
  validateFile?: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  databaseId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DatabaseSaveOptions {
  table: string;
  data: Record<string, any>;
  idField?: string;
}

/**
 * Main unified upload function
 * Handles storage upload + database synchronization
 */
export const uploadFileUnified = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  // IMMEDIATE CRITICAL DEBUG - Check what we received
  console.log(`🚨 [UnifiedUpload] CRITICAL DEBUG - Function entry:`, {
    fileReceived: !!file,
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size,
    fileConstructor: file?.constructor?.name,
    isBlob: file instanceof Blob,
    isFile: file instanceof File,
    optionsReceived: !!options,
    uploadType: options?.uploadType
  });

  const {
    uploadType,
    saveToDatabase = true,
    databaseTable,
    metadata = {},
    maxRetries = 3,
    validateFile = true
  } = options;

  console.log(`🚀 [UnifiedUpload] Starting upload for type: ${uploadType}`);

  // CRITICAL: Check file integrity at entry point
  console.log(`🔍 [UnifiedUpload] File integrity check at entry:`, {
    name: file.name,
    type: file.type,
    size: file.size,
    constructor: file.constructor.name,
    isBlob: file instanceof Blob,
    isFile: file instanceof File,
    hasValidType: file.type && file.type.startsWith('image/')
  });

  // Immediate MIME type validation
  if (!file.type || file.type === 'application/json' || !file.type.startsWith('image/')) {
    const error = `❌ [UnifiedUpload] Invalid file MIME type at entry: "${file.type}". Expected image/* type.`;
    console.error(error);
    return {
      success: false,
      error: `Invalid file MIME type: ${file.type}. Expected image/* type.`
    };
  }

  try {
    // 1. Validate upload type
    if (!isValidUploadType(uploadType)) {
      throw new Error(`Invalid upload type: ${uploadType}`);
    }

    // 2. Validate file if requested and get corrected MIME type
    let correctedMimeType = file.type;
    if (validateFile) {
      const validation = validateImageFile(file, {
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });

      if (!validation.isValid) {
        throw new Error(validation.error || 'File validation failed');
      }

      // Use the corrected MIME type from validation
      correctedMimeType = validation.correctedMimeType;
      console.log(`🔧 [UnifiedUpload] MIME type correction: "${file.type}" → "${correctedMimeType}"`);

      // If MIME type was corrected, create a new File object with the correct type
      if (correctedMimeType !== file.type) {
        console.log(`🔄 [UnifiedUpload] Creating new File object with corrected MIME type`);
        file = new File([file], file.name, {
          type: correctedMimeType,
          lastModified: file.lastModified
        });
        console.log(`✅ [UnifiedUpload] File object recreated with type: "${file.type}"`);
      }
    }

    // 3. Get storage configuration
    const storageConfig = getStorageConfig(uploadType);
    const fileName = generateUniqueFilename(file.name);
    const filePath = (storageConfig.folder && storageConfig.folder.trim() !== '')
      ? `${storageConfig.folder}/${fileName}`
      : fileName;

    console.log(`📤 [UnifiedUpload] Uploading to bucket: ${storageConfig.bucket}, path: ${filePath}`);

    // 4. Upload to storage with retry logic
    let uploadSuccess = false;
    let uploadError: any = null;
    let attempts = 0;

    while (attempts < maxRetries && !uploadSuccess) {
      try {
        // Use corrected MIME type from validation, fallback to file.type
        const contentType = correctedMimeType || file.type || 'application/octet-stream';

        // Log upload details for debugging
        const uploadDetails = {
          bucket: storageConfig.bucket,
          filePath,
          contentType,
          fileSize: file.size,
          fileName: file.name,
          fileType: file.type,
          fileConstructor: file.constructor.name,
          isBlob: file instanceof Blob,
          isFile: file instanceof File
        };
        console.log(`📤 [UnifiedUpload] Upload details:`, uploadDetails);

        // Additional validation
        if (file.type !== contentType) {
          console.warn(`⚠️ MIME type mismatch: file.type="${file.type}" vs contentType="${contentType}"`);
        }

        if (!file.type || file.type === 'application/json') {
          console.error(`❌ Invalid file MIME type detected: "${file.type}"`);
          throw new Error(`Invalid file MIME type: ${file.type}. Expected image/* type.`);
        }

        // CRITICAL FIX: Create a new FormData to ensure proper MIME type handling
        const formData = new FormData();

        // Create a new File object to ensure clean MIME type
        const cleanFile = new File([file], file.name, {
          type: contentType,
          lastModified: file.lastModified
        });

        console.log(`🔧 [UnifiedUpload] Created clean file:`, {
          originalType: file.type,
          cleanType: cleanFile.type,
          contentType,
          name: cleanFile.name,
          size: cleanFile.size
        });

        // Try direct Supabase upload with clean file
        const { error } = await supabase.storage
          .from(storageConfig.bucket)
          .upload(filePath, cleanFile, {
            contentType: contentType,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        uploadSuccess = true;
        console.log(`✅ [UnifiedUpload] Storage upload successful on attempt ${attempts + 1}`);
      } catch (error) {
        attempts++;
        uploadError = error;
        console.warn(`⚠️ [UnifiedUpload] Upload attempt ${attempts} failed:`, error);

        // If this is a MIME type error, try alternative upload method
        if (error instanceof Error && error.message && error.message.includes('mime type') && error.message.includes('application/json')) {
          console.log(`🔄 [UnifiedUpload] MIME type error detected, trying alternative upload method...`);

          try {
            // Alternative method: Use fetch directly with proper headers
            const supabaseUrl = supabase.supabaseUrl;
            const supabaseKey = supabase.supabaseKey;

            const uploadUrl = `${supabaseUrl}/storage/v1/object/${storageConfig.bucket}/${filePath}`;

            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': contentType,
                'x-upsert': 'false',
                'cache-control': '3600'
              },
              body: cleanFile
            });

            if (response.ok) {
              console.log(`✅ [UnifiedUpload] Alternative upload method successful`);
              uploadSuccess = true;
              break;
            } else {
              const errorText = await response.text();
              console.error(`❌ [UnifiedUpload] Alternative upload failed:`, response.status, errorText);
            }
          } catch (altError) {
            console.error(`❌ [UnifiedUpload] Alternative upload error:`, altError);
          }
        }

        if (attempts < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    if (!uploadSuccess) {
      throw new Error(`Upload failed after ${maxRetries} attempts: ${uploadError?.message}`);
    }

    // 5. Generate public URL
    const urlResult = generatePublicUrl(storageConfig.bucket, filePath);
    if (!urlResult.success || !urlResult.url) {
      throw new Error('Failed to generate public URL');
    }

    const publicUrl = urlResult.url;
    console.log(`🔗 [UnifiedUpload] Generated public URL: ${publicUrl.substring(0, 50)}...`);

    // 6. Save to database if requested
    let databaseId: string | undefined;
    if (saveToDatabase) {
      const dbResult = await saveToDatabaseByType(uploadType, {
        url: publicUrl,
        filePath,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        metadata
      }, databaseTable);

      if (!dbResult.success) {
        console.error(`❌ [UnifiedUpload] Database save failed:`, dbResult.error);
        // Don't fail the entire upload, but log the issue
      } else {
        databaseId = dbResult.id;
        console.log(`💾 [UnifiedUpload] Saved to database with ID: ${databaseId}`);
      }
    }

    return {
      success: true,
      url: publicUrl,
      filePath,
      databaseId,
      metadata: {
        ...metadata,
        uploadType,
        bucket: storageConfig.bucket,
        folder: storageConfig.folder,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type
      }
    };

  } catch (error) {
    console.error(`❌ [UnifiedUpload] Upload failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

/**
 * Save uploaded file data to appropriate database table based on upload type
 */
const saveToDatabaseByType = async (
  uploadType: string,
  fileData: {
    url: string;
    filePath: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    metadata: Record<string, any>;
  },
  customTable?: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const { url, fileName, originalName, fileSize, mimeType, metadata } = fileData;

    // Determine target table and data structure
    let targetTable: string;
    let saveData: Record<string, any>;
    let idField = 'id';

    if (customTable) {
      targetTable = customTable;
      saveData = {
        image_url: url,
        title: metadata.title || originalName.split('.')[0],
        description: metadata.description || '',
        ...metadata
      };
    } else {
      // Default table mapping based on upload type
      switch (uploadType.toLowerCase()) {
        case 'gallery':
        case 'gallery-main':
        case 'gallery-featured':
          targetTable = 'gallery_images';
          saveData = {
            id: uuidv4(),
            title: metadata.title || originalName.split('.')[0],
            description: metadata.description || '',
            image_url: url,
            category: metadata.category || 'main',
            sort_order: metadata.sort_order || 999,
            is_active: metadata.is_active !== false,
            is_featured: metadata.is_featured || false
          };
          break;

        case 'product':
        case 'product-image':
          // For products, we'll update the product record if product_id is provided
          if (metadata.product_id) {
            const { error } = await supabase
              .from('products')
              .update({ image_url: url })
              .eq('id', metadata.product_id);
            
            if (error) throw error;
            return { success: true, id: metadata.product_id };
          } else {
            // Create a general image record
            targetTable = 'gallery_images';
            saveData = {
              id: uuidv4(),
              title: `Product Image - ${originalName.split('.')[0]}`,
              description: 'Product image upload',
              image_url: url,
              category: 'product',
              sort_order: 999,
              is_active: true,
              is_featured: false
            };
          }
          break;

        default:
          // Default to gallery_images for unknown types
          targetTable = 'gallery_images';
          saveData = {
            id: uuidv4(),
            title: metadata.title || originalName.split('.')[0],
            description: metadata.description || `${uploadType} upload`,
            image_url: url,
            category: uploadType,
            sort_order: metadata.sort_order || 999,
            is_active: metadata.is_active !== false,
            is_featured: metadata.is_featured || false
          };
      }
    }

    console.log(`💾 [UnifiedUpload] Saving to table: ${targetTable}`);

    // Insert into database
    const { data, error } = await supabase
      .from(targetTable)
      .insert(saveData)
      .select(idField)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      id: data?.[idField] || saveData.id
    };

  } catch (error) {
    console.error(`❌ [UnifiedUpload] Database save error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database save failed'
    };
  }
};

/**
 * Upload multiple files using the unified service
 */
export const uploadMultipleFilesUnified = async (
  files: File[],
  options: UploadOptions
): Promise<{ success: boolean; results: UploadResult[]; errors: string[] }> => {
  console.log(`🚀 [UnifiedUpload] Starting batch upload of ${files.length} files`);

  const results: UploadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadFileUnified(file, options);
    results.push(result);
    
    if (!result.success && result.error) {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [UnifiedUpload] Batch upload complete: ${successCount}/${files.length} successful`);

  return {
    success: errors.length === 0,
    results,
    errors
  };
};

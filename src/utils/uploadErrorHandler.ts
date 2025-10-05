import { supabase } from '@/integrations/supabase/client';

/**
 * Upload Error Handler
 * FIXED: Comprehensive error handling and cleanup for failed uploads
 */

export interface UploadError {
  type: 'validation' | 'storage' | 'database' | 'network' | 'unknown';
  message: string;
  originalError?: any;
  retryable: boolean;
  cleanup?: () => Promise<void>;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Classify upload errors for better handling
 */
export const classifyUploadError = (error: any): UploadError => {
  if (!error) {
    return {
      type: 'unknown',
      message: 'Unknown error occurred',
      retryable: false
    };
  }

  const errorMessage = error.message || error.toString() || 'Unknown error';
  const errorCode = error.code || error.status;

  // Storage-specific errors
  if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return {
        type: 'storage',
        message: 'Storage bucket not found or inaccessible',
        originalError: error,
        retryable: false
      };
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return {
        type: 'storage',
        message: 'Storage permission denied',
        originalError: error,
        retryable: false
      };
    }

    if (errorMessage.includes('size') || errorMessage.includes('too large')) {
      return {
        type: 'validation',
        message: 'File size exceeds limit',
        originalError: error,
        retryable: false
      };
    }

    return {
      type: 'storage',
      message: `Storage error: ${errorMessage}`,
      originalError: error,
      retryable: true
    };
  }

  // Database errors
  if (errorMessage.includes('database') || errorMessage.includes('relation') || errorMessage.includes('column')) {
    return {
      type: 'database',
      message: `Database error: ${errorMessage}`,
      originalError: error,
      retryable: true
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return {
      type: 'network',
      message: `Network error: ${errorMessage}`,
      originalError: error,
      retryable: true
    };
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation') || errorMessage.includes('format')) {
    return {
      type: 'validation',
      message: `Validation error: ${errorMessage}`,
      originalError: error,
      retryable: false
    };
  }

  // HTTP status code based classification
  if (errorCode) {
    if (errorCode >= 400 && errorCode < 500) {
      return {
        type: 'validation',
        message: `Client error (${errorCode}): ${errorMessage}`,
        originalError: error,
        retryable: errorCode === 429 // Rate limit is retryable
      };
    }

    if (errorCode >= 500) {
      return {
        type: 'network',
        message: `Server error (${errorCode}): ${errorMessage}`,
        originalError: error,
        retryable: true
      };
    }
  }

  // Default classification
  return {
    type: 'unknown',
    message: errorMessage,
    originalError: error,
    retryable: true
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const classifiedError = classifyUploadError(error);
      
      // Don't retry non-retryable errors
      if (!classifiedError.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === options.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt),
        options.maxDelay
      );
      
      console.warn(`⚠️ [ErrorHandler] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, classifiedError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Cleanup orphaned files from storage
 */
export const cleanupOrphanedFile = async (bucketName: string, filePath: string): Promise<boolean> => {
  try {
    console.log(`🧹 [ErrorHandler] Cleaning up orphaned file: ${bucketName}/${filePath}`);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.warn(`⚠️ [ErrorHandler] Failed to cleanup file:`, error);
      return false;
    }
    
    console.log(`✅ [ErrorHandler] Successfully cleaned up orphaned file`);
    return true;
  } catch (error) {
    console.error(`❌ [ErrorHandler] Error during cleanup:`, error);
    return false;
  }
};

/**
 * Cleanup orphaned database records
 */
export const cleanupOrphanedDatabaseRecord = async (
  table: string,
  id: string,
  idField: string = 'id'
): Promise<boolean> => {
  try {
    console.log(`🧹 [ErrorHandler] Cleaning up orphaned database record: ${table}/${id}`);
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idField, id);
    
    if (error) {
      console.warn(`⚠️ [ErrorHandler] Failed to cleanup database record:`, error);
      return false;
    }
    
    console.log(`✅ [ErrorHandler] Successfully cleaned up orphaned database record`);
    return true;
  } catch (error) {
    console.error(`❌ [ErrorHandler] Error during database cleanup:`, error);
    return false;
  }
};

/**
 * Create cleanup function for failed uploads
 */
export const createCleanupFunction = (
  bucketName?: string,
  filePath?: string,
  databaseTable?: string,
  databaseId?: string
) => {
  return async (): Promise<void> => {
    const cleanupTasks: Promise<boolean>[] = [];
    
    // Cleanup storage file if provided
    if (bucketName && filePath) {
      cleanupTasks.push(cleanupOrphanedFile(bucketName, filePath));
    }
    
    // Cleanup database record if provided
    if (databaseTable && databaseId) {
      cleanupTasks.push(cleanupOrphanedDatabaseRecord(databaseTable, databaseId));
    }
    
    if (cleanupTasks.length > 0) {
      console.log(`🧹 [ErrorHandler] Running ${cleanupTasks.length} cleanup tasks`);
      await Promise.allSettled(cleanupTasks);
    }
  };
};

/**
 * Enhanced error reporting for user-friendly messages
 */
export const getUserFriendlyErrorMessage = (error: UploadError): string => {
  switch (error.type) {
    case 'validation':
      if (error.message.includes('size')) {
        return 'File is too large. Please choose a smaller image.';
      }
      if (error.message.includes('format') || error.message.includes('type')) {
        return 'Invalid file format. Please use JPG, PNG, GIF, or WebP images.';
      }
      return 'Invalid file. Please check your image and try again.';
      
    case 'storage':
      if (error.message.includes('permission')) {
        return 'Permission denied. Please contact support.';
      }
      return 'Storage error. Please try again later.';
      
    case 'database':
      return 'Database error. Your image was uploaded but may not appear immediately.';
      
    case 'network':
      return 'Network error. Please check your connection and try again.';
      
    default:
      return 'Upload failed. Please try again.';
  }
};

/**
 * Log upload error with context
 */
export const logUploadError = (
  error: UploadError,
  context: {
    fileName?: string;
    fileSize?: number;
    uploadType?: string;
    userId?: string;
  }
): void => {
  const logData = {
    errorType: error.type,
    errorMessage: error.message,
    retryable: error.retryable,
    context,
    timestamp: new Date().toISOString(),
    originalError: error.originalError
  };
  
  console.error('❌ [UploadError]', logData);
  
  // In production, you might want to send this to an error tracking service
  // Example: Sentry.captureException(error.originalError, { extra: logData });
};

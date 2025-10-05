/**
 * File validation utilities for image uploads
 */

export interface FileValidationResult {
  isValid: boolean;
  correctedMimeType: string;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
}

/**
 * Validates an image file and returns corrected MIME type
 */
export function validateImageFile(
  file: File, 
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSizeBytes = Infinity,
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  } = options;

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      correctedMimeType: file.type,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  // Get file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension) {
    return {
      isValid: false,
      correctedMimeType: file.type,
      error: 'File must have a valid extension'
    };
  }

  // Check if extension is allowed
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      correctedMimeType: file.type,
      error: `File extension .${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
    };
  }

  // MIME type mapping based on file extension
  const mimeTypeMap: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };

  // Determine correct MIME type
  const expectedMimeType = mimeTypeMap[fileExtension];
  const isValidMimeType = file.type.startsWith('image/') || allowedMimeTypes.includes(file.type);
  
  // Use the expected MIME type based on extension if the detected one is wrong
  const correctedMimeType = isValidMimeType ? file.type : expectedMimeType;

  if (!correctedMimeType) {
    return {
      isValid: false,
      correctedMimeType: file.type,
      error: `Unsupported file type: ${file.type} with extension .${fileExtension}`
    };
  }

  return {
    isValid: true,
    correctedMimeType,
    error: undefined
  };
}

/**
 * Creates a safe filename for upload
 */
export function createSafeFilename(originalName: string, prefix?: string): string {
  const fileExt = originalName.split('.').pop()?.toLowerCase();
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const safePrefix = prefix ? `${prefix}-` : '';
  
  return `${safePrefix}${timestamp}-${randomString}.${fileExt}`;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if a file is likely an image based on its content (magic numbers)
 */
export async function isImageByContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      
      // Check magic numbers for common image formats
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
        bmp: [0x42, 0x4D]
      };

      for (const [format, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => arr[index] === byte)) {
          resolve(true);
          return;
        }
      }
      
      resolve(false);
    };
    
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12)); // Read first 12 bytes
  });
}

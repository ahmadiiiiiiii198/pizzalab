/**
 * Centralized storage configuration for consistent bucket usage
 * This ensures all components use the same bucket names and folder structures
 *
 * FIXED: Added validation and standardized bucket usage
 */

export const STORAGE_BUCKETS = {
  // Main gallery images (public-facing) - PRIMARY BUCKET
  GALLERY: 'gallery',

  // Admin uploads (products, categories, etc.) - SECONDARY BUCKET
  ADMIN: 'admin-uploads',

  // General uploads (fallback) - TERTIARY BUCKET
  UPLOADS: 'uploads',

  // Specialty images - SPECIALTY BUCKET
  SPECIALTIES: 'specialties'
} as const;

// Default bucket for different upload types
export const DEFAULT_BUCKET_MAP = {
  'gallery': STORAGE_BUCKETS.GALLERY,
  'gallery-main': STORAGE_BUCKETS.GALLERY,
  'gallery-featured': STORAGE_BUCKETS.GALLERY,
  'product': STORAGE_BUCKETS.ADMIN,
  'product-image': STORAGE_BUCKETS.ADMIN,
  'category': STORAGE_BUCKETS.ADMIN,
  'category-image': STORAGE_BUCKETS.ADMIN,
  'logo': STORAGE_BUCKETS.ADMIN,
  'specialty': STORAGE_BUCKETS.SPECIALTIES,
  'general': STORAGE_BUCKETS.UPLOADS
} as const;

export const STORAGE_FOLDERS = {
  // Gallery folders (no subfolder needed for gallery bucket)
  GALLERY_MAIN: '',
  GALLERY_FEATURED: 'featured',
  GALLERY_CATEGORIES: 'categories',
  
  // Product folders
  PRODUCTS: 'products',
  PRODUCT_IMAGES: 'product-images',
  
  // Category folders
  CATEGORIES: 'categories',
  CATEGORY_IMAGES: 'category-images',
  
  // Admin folders
  ADMIN_UPLOADS: 'admin',
  LOGOS: 'logos',
  BACKGROUNDS: 'backgrounds',
  
  // Specialty folders
  SPECIALTIES: 'specialties',
  SPECIALTY_IMAGES: 'specialty-images'
} as const;

/**
 * Get the appropriate bucket and folder for different upload types
 * FIXED: Added validation and fallback handling
 */
export const getStorageConfig = (uploadType: string) => {
  // Validate upload type
  if (!uploadType || typeof uploadType !== 'string') {
    console.warn('⚠️ Invalid upload type provided, using default gallery config');
    return {
      bucket: STORAGE_BUCKETS.GALLERY,
      folder: STORAGE_FOLDERS.GALLERY_MAIN
    };
  }

  const normalizedType = uploadType.toLowerCase().trim();

  switch (normalizedType) {
    case 'gallery':
    case 'gallery-main':
      return {
        bucket: STORAGE_BUCKETS.GALLERY,
        folder: STORAGE_FOLDERS.GALLERY_MAIN
      };

    case 'gallery-featured':
      return {
        bucket: STORAGE_BUCKETS.GALLERY,
        folder: STORAGE_FOLDERS.GALLERY_FEATURED
      };

    case 'product':
    case 'product-image':
      return {
        bucket: STORAGE_BUCKETS.ADMIN,
        folder: STORAGE_FOLDERS.PRODUCTS
      };

    case 'category':
    case 'category-image':
      return {
        bucket: STORAGE_BUCKETS.ADMIN,
        folder: STORAGE_FOLDERS.CATEGORIES
      };

    case 'logo':
      return {
        bucket: STORAGE_BUCKETS.ADMIN,
        folder: STORAGE_FOLDERS.LOGOS
      };
      
    case 'background':
      return {
        bucket: STORAGE_BUCKETS.ADMIN,
        folder: STORAGE_FOLDERS.BACKGROUNDS
      };
      
    case 'specialty':
    case 'specialty-image':
      return {
        bucket: STORAGE_BUCKETS.SPECIALTIES,
        folder: STORAGE_FOLDERS.SPECIALTIES
      };
      
    case 'admin':
    case 'admin-upload':
      return {
        bucket: STORAGE_BUCKETS.ADMIN,
        folder: STORAGE_FOLDERS.ADMIN_UPLOADS
      };
      
    default:
      console.warn(`⚠️ Unknown upload type '${uploadType}', using default uploads bucket`);
      return {
        bucket: STORAGE_BUCKETS.UPLOADS,
        folder: STORAGE_FOLDERS.GENERAL
      };
  }
};

/**
 * Get bucket name for upload type with validation
 * FIXED: Added validation and fallback
 */
export const getBucketForUploadType = (uploadType: string): string => {
  const config = getStorageConfig(uploadType);
  return config.bucket;
};

/**
 * Validate if upload type is supported
 */
export const isValidUploadType = (uploadType: string): boolean => {
  const validTypes = [
    'gallery', 'gallery-main', 'gallery-featured',
    'product', 'product-image',
    'category', 'category-image',
    'logo', 'specialty', 'specialty-image',
    'admin', 'admin-upload'
  ];
  return validTypes.includes(uploadType.toLowerCase().trim());
};

/**
 * Get all bucket names for policy configuration
 */
export const getAllBucketNames = (): string[] => {
  return Object.values(STORAGE_BUCKETS);
};

/**
 * Check if a bucket name is valid
 */
export const isValidBucket = (bucketName: string): boolean => {
  return Object.values(STORAGE_BUCKETS).includes(bucketName as any);
};

/**
 * Get the public URL pattern for a bucket
 */
export const getPublicUrlPattern = (bucketName: string): string => {
  // This would be the Supabase project URL pattern
  // Replace with your actual Supabase project URL
  return `https://foymsziaullphulzhmxy.supabase.co/storage/v1/object/public/${bucketName}/`;
};

/**
 * Validate file type for upload type
 */
export const getAcceptedFileTypes = (uploadType: string): string[] => {
  switch (uploadType) {
    case 'gallery':
    case 'gallery-main':
    case 'gallery-featured':
    case 'product':
    case 'product-image':
    case 'category':
    case 'category-image':
    case 'logo':
    case 'background':
    case 'specialty':
    case 'specialty-image':
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
    case 'audio':
      return ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      
    case 'video':
      return ['video/mp4', 'video/webm', 'video/ogg'];
      
    default:
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  }
};

/**
 * Get maximum file size for upload type (in bytes)
 */
export const getMaxFileSize = (uploadType: string): number => {
  switch (uploadType) {
    case 'gallery':
    case 'gallery-main':
    case 'gallery-featured':
      return 10 * 1024 * 1024; // 10MB for gallery images
      
    case 'product':
    case 'product-image':
    case 'category':
    case 'category-image':
      return 5 * 1024 * 1024; // 5MB for product/category images
      
    case 'logo':
      return 2 * 1024 * 1024; // 2MB for logos
      
    case 'background':
      return 15 * 1024 * 1024; // 15MB for background images
      
    case 'audio':
      return 50 * 1024 * 1024; // 50MB for audio files
      
    case 'video':
      return 100 * 1024 * 1024; // 100MB for video files
      
    default:
      return 5 * 1024 * 1024; // 5MB default
  }
};

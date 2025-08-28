-- Remove file size limits from all storage buckets
-- This migration removes the file size limitations to allow unlimited file uploads

-- Update all existing storage buckets to remove file size limits
UPDATE storage.buckets 
SET file_size_limit = NULL, updated_at = NOW()
WHERE id IN ('uploads', 'admin-uploads', 'gallery', 'specialties');

-- Verify the changes
SELECT id, name, file_size_limit, public 
FROM storage.buckets 
WHERE id IN ('uploads', 'admin-uploads', 'gallery', 'specialties');

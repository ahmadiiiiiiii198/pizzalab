-- CRITICAL FIX: Unified Storage Policies for Image Upload System
-- Run this script in your Supabase SQL Editor to fix image upload issues
-- This script unifies all storage policies to allow both authenticated and anonymous uploads

-- ============================================================================
-- STEP 1: DROP ALL EXISTING CONFLICTING POLICIES
-- ============================================================================

-- Drop all existing storage object policies
DROP POLICY IF EXISTS "Allow public read access to storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from image buckets" ON storage.objects;

-- Drop existing bucket policies
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;

-- ============================================================================
-- STEP 2: CREATE UNIFIED STORAGE POLICIES
-- ============================================================================

-- Enable RLS on storage tables (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create unified policies that work for both authenticated and anonymous users
-- These policies allow uploads to all image buckets from both auth states

-- 1. Public read access to all image buckets
CREATE POLICY "Public read access to image buckets" ON storage.objects
  FOR SELECT 
  USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

-- 2. Allow uploads from both authenticated and anonymous users
CREATE POLICY "Allow uploads to image buckets" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- 3. Allow updates from both authenticated and anonymous users
CREATE POLICY "Allow updates to image buckets" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  )
  WITH CHECK (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- 4. Allow deletes from both authenticated and anonymous users
CREATE POLICY "Allow deletes from image buckets" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- 5. Public bucket access policy
CREATE POLICY "Public bucket access" ON storage.buckets
  FOR SELECT 
  USING (true);

-- ============================================================================
-- STEP 3: ENSURE ALL REQUIRED BUCKETS EXIST
-- ============================================================================

-- Create or update all required storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES 
  ('uploads', 'uploads', true, NULL, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW()),
  ('admin-uploads', 'admin-uploads', true, NULL, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW()),
  ('gallery', 'gallery', true, NULL, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW()),
  ('specialties', 'specialties', true, NULL, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Check that all policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;

-- Check that all buckets exist and are properly configured
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id IN ('uploads', 'admin-uploads', 'gallery', 'specialties')
ORDER BY name;

-- ============================================================================
-- STEP 5: TEST QUERIES (OPTIONAL)
-- ============================================================================

-- Test bucket access (should return all buckets)
-- SELECT * FROM storage.buckets;

-- Test if you can list objects in a bucket (should work without errors)
-- SELECT * FROM storage.objects WHERE bucket_id = 'gallery' LIMIT 5;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Add a comment to confirm the fix was applied
COMMENT ON POLICY "Allow uploads to image buckets" ON storage.objects IS 
'FIXED: Unified storage policy that allows both authenticated and anonymous users to upload images. Applied on ' || NOW()::text;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STORAGE POLICY FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '   - Dropped all conflicting storage policies';
  RAISE NOTICE '   - Created unified policies for authenticated and anonymous users';
  RAISE NOTICE '   - Ensured all required buckets exist and are properly configured';
  RAISE NOTICE '   - Image uploads should now work in both admin panel and frontend';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Next steps:';
  RAISE NOTICE '   1. Test image upload in admin panel';
  RAISE NOTICE '   2. Verify images appear in frontend gallery';
  RAISE NOTICE '   3. Check browser console for any remaining errors';
END $$;

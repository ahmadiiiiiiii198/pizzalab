-- Fix Storage Policies for Admin Panel Image Uploads
-- This migration resolves conflicts between public and authenticated policies

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Allow public uploads to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to storage objects" ON storage.objects;

-- Create unified policies that work for both public and authenticated users
-- This allows admin panel to work regardless of authentication state

-- Allow anyone to read from image buckets (public access)
CREATE POLICY "Public read access to image buckets" ON storage.objects
  FOR SELECT 
  USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

-- Allow uploads from both authenticated and anonymous users
CREATE POLICY "Allow uploads to image buckets" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- Allow updates from both authenticated and anonymous users
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

-- Allow deletes from both authenticated and anonymous users
CREATE POLICY "Allow deletes from image buckets" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- Ensure all required buckets exist with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES 
  ('uploads', 'uploads', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW()),
  ('admin-uploads', 'admin-uploads', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW()),
  ('gallery', 'gallery', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW()),
  ('specialties', 'specialties', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Ensure bucket policies allow public access
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
CREATE POLICY "Public bucket access" ON storage.buckets
  FOR SELECT 
  USING (true);

-- Add helpful comment
COMMENT ON POLICY "Allow uploads to image buckets" ON storage.objects IS 
'Allows both authenticated and anonymous users to upload images to admin buckets. This enables admin panel functionality regardless of auth state.';

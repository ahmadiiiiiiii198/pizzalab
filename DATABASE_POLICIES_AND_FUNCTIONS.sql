-- Pizzeria Regina 2000 - RLS Policies and Functions Setup
-- Run this AFTER the main DATABASE_SETUP_SCRIPT.sql

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- 5.1 Settings Table Policies
DROP POLICY IF EXISTS "Allow public read access to settings" ON settings;
CREATE POLICY "Allow public read access to settings" 
  ON settings 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
CREATE POLICY "Allow authenticated users to update settings" 
  ON settings 
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON settings;
CREATE POLICY "Allow authenticated users to insert settings" 
  ON settings 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete settings" ON settings;
CREATE POLICY "Allow authenticated users to delete settings" 
  ON settings 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 5.2 Categories Table Policies
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" 
  ON categories 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to categories" ON categories;
CREATE POLICY "Allow authenticated users full access to categories" 
  ON categories 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.3 Products Table Policies
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" 
  ON products 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
CREATE POLICY "Allow authenticated users full access to products" 
  ON products 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.4 Orders Table Policies
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
CREATE POLICY "Allow public read access to orders" 
  ON orders 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to orders" ON orders;
CREATE POLICY "Allow authenticated users full access to orders" 
  ON orders 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;
CREATE POLICY "Allow authenticated users to delete orders" 
  ON orders 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 5.5 Order Items Table Policies
DROP POLICY IF EXISTS "Allow public read access to order items" ON order_items;
CREATE POLICY "Allow public read access to order items" 
  ON order_items 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to order items" ON order_items;
CREATE POLICY "Allow authenticated users full access to order items" 
  ON order_items 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete order items" ON order_items;
CREATE POLICY "Allow authenticated users to delete order items" 
  ON order_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 5.6 Order Notifications Table Policies
DROP POLICY IF EXISTS "Allow public read access to order notifications" ON order_notifications;
CREATE POLICY "Allow public read access to order notifications" 
  ON order_notifications 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to order notifications" ON order_notifications;
CREATE POLICY "Allow authenticated users full access to order notifications" 
  ON order_notifications 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete order notifications" ON order_notifications;
CREATE POLICY "Allow authenticated users to delete order notifications" 
  ON order_notifications 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 5.7 Order Status History Table Policies
DROP POLICY IF EXISTS "Allow public read access to order status history" ON order_status_history;
CREATE POLICY "Allow public read access to order status history" 
  ON order_status_history 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to order status history" ON order_status_history;
CREATE POLICY "Allow authenticated users full access to order status history" 
  ON order_status_history 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete order status history" ON order_status_history;
CREATE POLICY "Allow authenticated users to delete order status history" 
  ON order_status_history 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 5.8 User Profiles Table Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" 
  ON user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
  ON user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
CREATE POLICY "Authenticated users can view all profiles" 
  ON user_profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 5.9 Admin Sessions Table Policies
DROP POLICY IF EXISTS "Admin sessions are private" ON admin_sessions;
CREATE POLICY "Admin sessions are private" 
  ON admin_sessions 
  FOR ALL 
  USING (false);

-- 5.10 Admin Activity Log Table Policies
DROP POLICY IF EXISTS "Admin activity log is private" ON admin_activity_log;
CREATE POLICY "Admin activity log is private" 
  ON admin_activity_log 
  FOR ALL 
  USING (false);

-- 5.11 Content Sections Table Policies
DROP POLICY IF EXISTS "Allow public read access to active content sections" ON content_sections;
CREATE POLICY "Allow public read access to active content sections" 
  ON content_sections 
  FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated users full access to content sections" ON content_sections;
CREATE POLICY "Allow authenticated users full access to content sections" 
  ON content_sections 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.12 Category Sections Table Policies
DROP POLICY IF EXISTS "Allow public read access to category sections" ON category_sections;
CREATE POLICY "Allow public read access to category sections" 
  ON category_sections 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to category sections" ON category_sections;
CREATE POLICY "Allow authenticated users full access to category sections" 
  ON category_sections 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.13 Site Content Table Policies
DROP POLICY IF EXISTS "Allow public read access to site content" ON site_content;
CREATE POLICY "Allow public read access to site content" 
  ON site_content 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to site content" ON site_content;
CREATE POLICY "Allow authenticated users full access to site content" 
  ON site_content 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.14 Comments Table Policies
DROP POLICY IF EXISTS "Allow public read access to approved comments" ON comments;
CREATE POLICY "Allow public read access to approved comments" 
  ON comments 
  FOR SELECT 
  USING (is_approved = true AND is_active = true);

DROP POLICY IF EXISTS "Allow public insert to comments" ON comments;
CREATE POLICY "Allow public insert to comments" 
  ON comments 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to comments" ON comments;
CREATE POLICY "Allow authenticated users full access to comments" 
  ON comments 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.15 Gallery Images Table Policies
DROP POLICY IF EXISTS "Allow public read access to active gallery images" ON gallery_images;
CREATE POLICY "Allow public read access to active gallery images" 
  ON gallery_images 
  FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated users full access to gallery images" ON gallery_images;
CREATE POLICY "Allow authenticated users full access to gallery images" 
  ON gallery_images 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.16 YouTube Videos Table Policies
DROP POLICY IF EXISTS "Allow public read access to active youtube videos" ON youtube_videos;
CREATE POLICY "Allow public read access to active youtube videos" 
  ON youtube_videos 
  FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated users full access to youtube videos" ON youtube_videos;
CREATE POLICY "Allow authenticated users full access to youtube videos" 
  ON youtube_videos 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.17 Storage Policies - UNIFIED APPROACH
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Allow public read access to storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to image buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from image buckets" ON storage.objects;

-- Create unified policies that work for both authenticated and anonymous users
CREATE POLICY "Public read access to image buckets" ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

CREATE POLICY "Allow uploads to image buckets" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

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

CREATE POLICY "Allow deletes from image buckets" ON storage.objects
  FOR DELETE
  USING (
    bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties') AND
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- Bucket access policies
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;
CREATE POLICY "Public bucket access" ON storage.buckets
  FOR SELECT
  USING (true);

-- ============================================================================
-- STEP 6: CREATE DATABASE FUNCTIONS
-- ============================================================================

-- 6.1 Update Timestamp Functions
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_content_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.2 User Profile Creation Function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6.3 Order Cascade Delete Function
CREATE OR REPLACE FUNCTION delete_order_cascade(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_exists BOOLEAN;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = order_uuid) INTO order_exists;

    IF NOT order_exists THEN
        RAISE EXCEPTION 'Order with ID % does not exist', order_uuid;
    END IF;

    -- Delete in correct order to avoid foreign key violations
    -- 1. Delete order notifications
    DELETE FROM order_notifications WHERE order_id = order_uuid;

    -- 2. Delete order status history
    DELETE FROM order_status_history WHERE order_id = order_uuid;

    -- 3. Delete order items
    DELETE FROM order_items WHERE order_id = order_uuid;

    -- 4. Finally delete the order
    DELETE FROM orders WHERE id = order_uuid;

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting order: %', SQLERRM;
        RETURN false;
END;
$$;

-- 6.4 Order Status Update Function
CREATE OR REPLACE FUNCTION update_order_status(
  order_uuid TEXT,
  new_status TEXT,
  status_notes TEXT DEFAULT NULL,
  tracking_num TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update the order status
  UPDATE orders
  SET
    status = new_status,
    tracking_number = COALESCE(tracking_num, tracking_number),
    updated_at = NOW()
  WHERE id = order_uuid::UUID;

  -- Insert status history record
  INSERT INTO order_status_history (order_id, status, notes)
  VALUES (order_uuid::UUID, new_status, status_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Admin Session Management Functions
CREATE OR REPLACE FUNCTION create_admin_session(
  p_username TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  session_token TEXT;
BEGIN
  -- Generate secure session token
  session_token := encode(gen_random_bytes(32), 'base64');

  -- Insert session record
  INSERT INTO admin_sessions (
    session_token,
    username,
    ip_address,
    user_agent
  ) VALUES (
    session_token,
    p_username,
    p_ip_address,
    p_user_agent
  );

  -- Log the login activity
  INSERT INTO admin_activity_log (
    username,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_username,
    'LOGIN',
    jsonb_build_object('success', true),
    p_ip_address,
    p_user_agent
  );

  RETURN session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_admin_session(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  session_valid BOOLEAN := false;
BEGIN
  -- Check if session exists and is valid
  SELECT EXISTS(
    SELECT 1 FROM admin_sessions
    WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > NOW()
  ) INTO session_valid;

  -- Update last activity if session is valid
  IF session_valid THEN
    UPDATE admin_sessions
    SET last_activity = NOW()
    WHERE session_token = p_session_token;
  END IF;

  RETURN session_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION invalidate_admin_session(p_session_token TEXT)
RETURNS VOID AS $$
DECLARE
  session_username TEXT;
BEGIN
  -- Get username for logging
  SELECT username INTO session_username
  FROM admin_sessions
  WHERE session_token = p_session_token;

  -- Invalidate session
  UPDATE admin_sessions
  SET is_active = false
  WHERE session_token = p_session_token;

  -- Log logout activity
  IF session_username IS NOT NULL THEN
    INSERT INTO admin_activity_log (
      username,
      action,
      details
    ) VALUES (
      session_username,
      'LOGOUT',
      jsonb_build_object('session_token', p_session_token)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

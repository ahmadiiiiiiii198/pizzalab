-- Pizzeria Regina 2000 - Storage Buckets, Triggers, and Initial Data
-- Run this AFTER the main setup script and policies script

-- ============================================================================
-- STEP 7: CREATE STORAGE BUCKETS
-- ============================================================================

-- 7.1 Create uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'uploads',
  'uploads',
  true,
  NULL, -- No size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- 7.2 Create admin-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'admin-uploads',
  'admin-uploads',
  true,
  NULL, -- No size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- 7.3 Create gallery bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'gallery',
  'gallery',
  true,
  NULL, -- No size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- 7.4 Create specialties bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'specialties',
  'specialties',
  true,
  NULL, -- No size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- ============================================================================
-- STEP 8: CREATE TRIGGERS
-- ============================================================================

-- 8.1 Settings table trigger
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- 8.2 User profiles table trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- 8.3 Content sections table trigger
DROP TRIGGER IF EXISTS update_content_sections_updated_at ON content_sections;
CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sections_updated_at();

-- 8.4 User profile creation trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- 8.5 Admin session cleanup functions and triggers
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Delete expired sessions
  DELETE FROM admin_sessions
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO admin_activity_log (
    username,
    action,
    details
  ) VALUES (
    'SYSTEM',
    'SESSION_CLEANUP',
    jsonb_build_object('cleaned_sessions', cleaned_count)
  );
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_admin_activity(
  p_username TEXT,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_activity_log (
    username,
    action,
    resource,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_username,
    p_action,
    p_resource,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_cleanup_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Cleanup expired sessions when new session is created
  PERFORM cleanup_expired_admin_sessions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_sessions_trigger ON admin_sessions;
CREATE TRIGGER cleanup_sessions_trigger
  AFTER INSERT ON admin_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_sessions();

-- 8.6 Role checking function
CREATE OR REPLACE FUNCTION has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id::UUID
    AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.7 Category sections trigger function
CREATE OR REPLACE FUNCTION update_category_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_category_sections_updated_at ON category_sections;
CREATE TRIGGER update_category_sections_updated_at
  BEFORE UPDATE ON category_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_category_sections_updated_at();

-- ============================================================================
-- STEP 9: INSERT INITIAL SETTINGS DATA
-- ============================================================================

-- 9.1 Core Restaurant Settings
INSERT INTO settings (key, value) VALUES
  (
    'heroContent',
    '{"heading": "PizzaLab Pizzeria", "subheading": "Laboratorio di pizza italiana innovativa", "backgroundImage": "/hero-pizza-bg.jpg"}'
  ),
  (
    'logoSettings',
    '{"logoUrl": "/pizzalab-logo.png", "altText": "PizzaLab Pizzeria Logo"}'
  ),
  (
    'restaurantSettings',
    '{"totalSeats": 50, "reservationDuration": 120, "openingTime": "11:30", "closingTime": "22:00", "languages": ["it", "en", "ar", "fa"], "defaultLanguage": "it"}'
  ),
  (
    'contactContent',
    '{"address": "Via Innovation, 1, 10100 Torino TO", "phone": "+393479190907", "email": "info@pizzalab.it", "mapUrl": "https://maps.google.com", "hours": "Lun-Dom: 18:00 - 23:00"}'
  ),
  (
    'businessHours',
    '{"monday": {"isOpen": true, "openTime": "14:30", "closeTime": "22:30"}, "tuesday": {"isOpen": true, "openTime": "14:30", "closeTime": "22:30"}, "wednesday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "thursday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "friday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "saturday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "sunday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}}'
  ),
  (
    'galleryContent',
    '{"heading": "La Nostra Galleria", "subheading": "Scorci delle nostre creazioni e dell\'atmosfera della pizzeria"}'
  ),
  (
    'galleryImages',
    '[]'
  ),
  (
    'popups',
    '[]'
  ),
  (
    'reservations',
    '[]'
  ),
  (
    'weOfferContent',
    '{"heading": "Cosa Offriamo", "services": ["Pizza Napoletana Autentica", "Ingredienti Freschi e Locali", "Consegna a Domicilio", "Prenotazioni Online", "Ambiente Familiare"]}'
  ),
  (
    'aboutContent',
    '{"heading": "La Nostra Storia", "content": "Dal 2000 portiamo a Torino la vera tradizione della pizza napoletana. La nostra famiglia ha tramandato di generazione in generazione i segreti di un impasto perfetto e di ingredienti selezionati."}'
  ),
  (
    'menuSettings',
    '{"showPrices": true, "showIngredients": true, "showAllergens": true, "showCalories": false, "showPreparationTime": true}'
  ),
  (
    'deliverySettings',
    '{"deliveryFee": 3.50, "freeDeliveryMinimum": 25.00, "deliveryRadius": 10, "estimatedDeliveryTime": "30-45 minuti"}'
  ),
  (
    'paymentSettings',
    '{"acceptCash": true, "acceptCard": true, "acceptOnlinePayment": true, "stripeEnabled": true}'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- 9.2 Admin Settings
INSERT INTO settings (key, value) VALUES
  (
    'adminSecuritySettings',
    '{
      "sessionTimeout": 86400,
      "maxLoginAttempts": 5,
      "lockoutDuration": 900,
      "requireStrongPassword": true,
      "enableActivityLogging": true
    }'
  ),
  (
    'adminUISettings',
    '{
      "theme": "dark",
      "compactMode": false,
      "showAdvancedFeatures": true,
      "autoSave": true,
      "notificationSound": true
    }'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================================================
-- STEP 10: INSERT INITIAL CONTENT SECTIONS
-- ============================================================================

INSERT INTO content_sections (section_key, section_name, content_type, content_value, metadata, is_active) VALUES
  (
    'hero_main_content',
    'Hero Section - Main Content',
    'json',
    '{"heading": "Pizzeria Regina 2000", "subheading": "Autentica pizza italiana nel cuore di Torino", "backgroundImage": "/hero-pizza-bg.jpg"}',
    '{"section": "hero"}',
    true
  ),
  (
    'about_main_content',
    'About Section - Main Content',
    'json',
    '{"heading": "La Nostra Storia", "content": "Dal 2000 portiamo a Torino la vera tradizione della pizza napoletana. La nostra famiglia ha tramandato di generazione in generazione i segreti di un impasto perfetto e di ingredienti selezionati. Utilizziamo solo ingredienti freschi e di prima qualità: mozzarella di bufala DOP, pomodori San Marzano, olio extravergine di oliva e farina tipo 00."}',
    '{"section": "about"}',
    true
  ),
  (
    'categories_main_content',
    'Categories Section - Main Content',
    'json',
    '{"heading": "Le Nostre Pizze", "subheading": "Scopri la nostra ampia gamma di pizze tradizionali e speciali"}',
    '{"section": "categories"}',
    true
  ),
  (
    'contact_main_content',
    'Contact Section - Main Content',
    'json',
    '{"heading": "Contattaci", "subheading": "Siamo qui per servirti nel cuore di Torino"}',
    '{"section": "contact"}',
    true
  )
ON CONFLICT (section_key) DO UPDATE SET
  content_value = EXCLUDED.content_value,
  updated_at = NOW();

-- ============================================================================
-- STEP 11: INSERT INITIAL CATEGORY SECTIONS
-- ============================================================================

INSERT INTO category_sections (name, slug, description, section_type, sort_order) VALUES
  ('SEMPLICI', 'semplici', 'Classic Pizzas & Focacce - Le nostre pizze tradizionali e focacce', 'categories', 1),
  ('SPECIALI', 'speciali', 'Signature & Gourmet - Creazioni speciali della casa', 'categories', 2),
  ('Pizze al metro per 4-5 persone', 'pizze-al-metro-per-4-5-persone', 'Pizze al metro ideali per gruppi di 4-5 persone', 'categories', 3),
  ('BEVANDE', 'bevande', 'Bevande e bibite', 'categories', 4),
  ('DOLCI', 'dolci', 'Dolci e dessert', 'categories', 6),
  ('FARINATE', 'farinate', 'Farinate', 'categories', 7),
  ('SCHIACCIATE', 'schiacciate', 'Schiacciate', 'categories', 8),
  ('EXTRA', 'extra', 'Aggiunte per pizze e altri prodotti', 'categories', 8),
  ('Featured Pizzas', 'featured-pizzas', 'Le nostre pizze più popolari e consigliate', 'products', 1),
  ('New Pizzas', 'new-pizzas', 'Ultime aggiunte al nostro menu', 'products', 2),
  ('Best Sellers', 'best-sellers', 'Pizze preferite dai clienti', 'products', 3),
  ('Seasonal Specials', 'seasonal-specials', 'Offerte stagionali a tempo limitato', 'products', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- STEP 12: ENABLE REALTIME FOR TABLES
-- ============================================================================

-- Enable realtime for order_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE order_notifications;

-- Enable realtime for settings table (for live admin updates)
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- Enable realtime for orders table (for order status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================================
-- STEP 11: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE settings IS 'Core application settings and configuration';
COMMENT ON TABLE categories IS 'Product categories for menu organization';
COMMENT ON TABLE products IS 'Menu items with detailed information';
COMMENT ON TABLE orders IS 'Customer orders with payment and delivery info';
COMMENT ON TABLE order_items IS 'Individual items within orders';
COMMENT ON TABLE order_notifications IS 'Order-related notifications';
COMMENT ON TABLE order_status_history IS 'Order status change tracking';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON TABLE admin_sessions IS 'Admin session management for secure authentication';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for admin activities';
COMMENT ON TABLE content_sections IS 'Dynamic content sections for website';
COMMENT ON TABLE gallery_images IS 'Gallery image management';
COMMENT ON TABLE youtube_videos IS 'YouTube video content management';
COMMENT ON TABLE comments IS 'Customer reviews and feedback';

-- Function comments
COMMENT ON FUNCTION delete_order_cascade(UUID) IS 'Safely deletes an order and all its related records in correct order';
COMMENT ON FUNCTION create_admin_session IS 'Creates a new admin session with security logging';
COMMENT ON FUNCTION validate_admin_session IS 'Validates admin session and updates activity';
COMMENT ON FUNCTION invalidate_admin_session IS 'Invalidates admin session and logs logout';
COMMENT ON FUNCTION cleanup_expired_admin_sessions IS 'Cleans up expired admin sessions';
COMMENT ON FUNCTION log_admin_activity IS 'Logs admin activities for audit trail';
COMMENT ON FUNCTION has_role IS 'Checks if a user has a specific role';
COMMENT ON FUNCTION update_order_status IS 'Updates order status with history tracking';

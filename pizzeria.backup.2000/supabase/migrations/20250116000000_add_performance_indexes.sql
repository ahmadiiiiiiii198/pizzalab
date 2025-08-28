-- Performance Optimization Migration
-- Add critical indexes to improve query performance

-- Products table indexes
-- Index for filtering by is_active (used in almost every query)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Index for category_id (used for joins with categories)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Index for name ordering (used for ORDER BY name)
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Composite index for common query pattern: active products ordered by name
CREATE INDEX IF NOT EXISTS idx_products_active_name ON products(is_active, name) WHERE is_active = true;

-- Composite index for category filtering with active products
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active) WHERE is_active = true;

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Categories table indexes
-- Index for filtering by is_active
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Index for sort_order (used for ordering categories)
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Composite index for active categories ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order) WHERE is_active = true;

-- Orders table indexes (if not already present)
-- Index for customer_email (used for order tracking)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Index for status (used for filtering orders by status)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Index for created_at (used for ordering orders by date)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Composite index for customer orders by status and date
CREATE INDEX IF NOT EXISTS idx_orders_customer_status_date ON orders(customer_email, status, created_at);

-- Order items table indexes (if exists)
-- Index for order_id (used for joins)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items');

-- Index for product_id (used for joins)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items');

-- Gallery images table indexes (if exists)
-- Index for is_active (used for filtering active images)
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_active ON gallery_images(is_active) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery_images');

-- Index for sort_order (used for ordering images)
CREATE INDEX IF NOT EXISTS idx_gallery_images_sort_order ON gallery_images(sort_order) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery_images');

-- Content sections table indexes (if exists)
-- Index for section_key (used for filtering by section)
CREATE INDEX IF NOT EXISTS idx_content_sections_section_key ON content_sections(section_key) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_sections');

-- Index for is_active (used for filtering active content)
CREATE INDEX IF NOT EXISTS idx_content_sections_is_active ON content_sections(is_active) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_sections');

-- Category sections table indexes (if exists)
-- Index for section_type (used for filtering by type)
CREATE INDEX IF NOT EXISTS idx_category_sections_section_type ON category_sections(section_type) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_sections');

-- Index for is_active (used for filtering active sections)
CREATE INDEX IF NOT EXISTS idx_category_sections_is_active ON category_sections(is_active) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_sections');

-- Index for sort_order (used for ordering sections)
CREATE INDEX IF NOT EXISTS idx_category_sections_sort_order ON category_sections(sort_order) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_sections');

-- Add comments for documentation
COMMENT ON INDEX idx_products_is_active IS 'Improves performance for filtering active products';
COMMENT ON INDEX idx_products_category_id IS 'Improves performance for category-product joins';
COMMENT ON INDEX idx_products_name IS 'Improves performance for name-based ordering';
COMMENT ON INDEX idx_products_active_name IS 'Composite index for common active products + name ordering query';
COMMENT ON INDEX idx_products_category_active IS 'Composite index for category filtering with active products';
COMMENT ON INDEX idx_categories_is_active IS 'Improves performance for filtering active categories';
COMMENT ON INDEX idx_categories_sort_order IS 'Improves performance for category ordering';
COMMENT ON INDEX idx_categories_active_sort IS 'Composite index for active categories ordered by sort_order';

-- Analyze tables to update statistics after adding indexes
ANALYZE products;
ANALYZE categories;
ANALYZE orders;
ANALYZE settings;

-- Database Study Script for PizzaLab
-- This script provides comprehensive information about the database structure

-- ============================================================================
-- 1. BASIC DATABASE INFORMATION
-- ============================================================================

-- Show current database and user
SELECT current_database() as database_name, current_user as current_user;

-- Show database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- ============================================================================
-- 2. TABLES OVERVIEW
-- ============================================================================

-- List all tables with row counts and sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes,
    n_tup_ins + n_tup_upd + n_tup_del as total_changes
FROM pg_tables pt
LEFT JOIN pg_class c ON c.relname = pt.tablename
LEFT JOIN pg_stat_user_tables psut ON psut.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 3. TABLE RELATIONSHIPS (FOREIGN KEYS)
-- ============================================================================

-- Show all foreign key relationships
SELECT 
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. INDEXES ANALYSIS
-- ============================================================================

-- Show all indexes with their sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    idx_tup_read,
    idx_tup_fetch
FROM pg_indexes pi
LEFT JOIN pg_stat_user_indexes psui ON psui.indexrelname = pi.indexname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ============================================================================
-- 5. COLUMN ANALYSIS
-- ============================================================================

-- Show all columns with their data types and constraints
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 6. BUSINESS DATA OVERVIEW
-- ============================================================================

-- Categories overview
SELECT 
    'categories' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records
FROM categories
UNION ALL
-- Products overview
SELECT 
    'products' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records
FROM products
UNION ALL
-- Orders overview
SELECT 
    'orders' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders
FROM orders;

-- ============================================================================
-- 7. RECENT ACTIVITY
-- ============================================================================

-- Recent orders
SELECT 
    order_number,
    customer_name,
    total_amount,
    order_status,
    payment_status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Recent order items with product details
SELECT 
    o.order_number,
    oi.product_name,
    oi.quantity,
    oi.subtotal,
    p.name as product_db_name,
    c.name as category_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY oi.created_at DESC
LIMIT 20;

-- ============================================================================
-- 8. SETTINGS AND CONFIGURATION
-- ============================================================================

-- Show all settings
SELECT 
    key,
    CASE 
        WHEN key LIKE '%password%' OR key LIKE '%secret%' OR key LIKE '%key%' 
        THEN '[HIDDEN]'
        ELSE value::text
    END as value,
    created_at,
    updated_at
FROM settings
ORDER BY key;

-- ============================================================================
-- 9. FEATURE TYPES AND DYNAMIC TABLES
-- ============================================================================

-- Show feature types and their associated tables
SELECT 
    ft.name,
    ft.slug,
    ft.table_name,
    ft.is_active,
    ft.has_categories,
    ft.has_price,
    ft.has_size,
    ft.custom_fields
FROM feature_types ft
ORDER BY ft.sort_order, ft.name;

-- ============================================================================
-- 10. PERFORMANCE INSIGHTS
-- ============================================================================

-- Show table statistics for performance monitoring
SELECT 
    schemaname,
    relname as table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan + idx_scan DESC;

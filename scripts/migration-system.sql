-- Migration System for PizzaLab Database
-- This script creates a migration tracking system and provides utilities

-- ============================================================================
-- 1. CREATE MIGRATION TRACKING TABLE
-- ============================================================================

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sql_up TEXT NOT NULL,
    sql_down TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'failed', 'rolled_back'))
);

-- Add comment to migrations table
COMMENT ON TABLE migrations IS 'Tracks database migrations and schema changes';
COMMENT ON COLUMN migrations.migration_name IS 'Unique identifier for the migration';
COMMENT ON COLUMN migrations.description IS 'Human-readable description of what the migration does';
COMMENT ON COLUMN migrations.sql_up IS 'SQL commands to apply the migration';
COMMENT ON COLUMN migrations.sql_down IS 'SQL commands to rollback the migration';
COMMENT ON COLUMN migrations.checksum IS 'MD5 hash of the sql_up content for integrity checking';

-- ============================================================================
-- 2. MIGRATION UTILITY FUNCTIONS
-- ============================================================================

-- Function to record a migration
CREATE OR REPLACE FUNCTION record_migration(
    p_migration_name VARCHAR(255),
    p_description TEXT,
    p_sql_up TEXT,
    p_sql_down TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO migrations (
        migration_name,
        description,
        sql_up,
        sql_down,
        checksum
    ) VALUES (
        p_migration_name,
        p_description,
        p_sql_up,
        p_sql_down,
        MD5(p_sql_up)
    );
    
    RAISE NOTICE 'Migration % recorded successfully', p_migration_name;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a migration has been applied
CREATE OR REPLACE FUNCTION migration_applied(p_migration_name VARCHAR(255)) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM migrations 
        WHERE migration_name = p_migration_name 
        AND status = 'applied'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get migration status
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE (
    migration_name VARCHAR(255),
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_by VARCHAR(100),
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.migration_name,
        m.description,
        m.applied_at,
        m.applied_by,
        m.status
    FROM migrations m
    ORDER BY m.applied_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. SCHEMA BACKUP FUNCTIONS
-- ============================================================================

-- Function to backup current schema structure
CREATE OR REPLACE FUNCTION backup_schema_structure()
RETURNS TEXT AS $$
DECLARE
    backup_content TEXT := '';
    rec RECORD;
BEGIN
    -- Add header
    backup_content := '-- Schema Backup Generated: ' || NOW() || E'\n\n';
    
    -- Backup table structures
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    LOOP
        backup_content := backup_content || 
            '-- Table: ' || rec.table_name || E'\n' ||
            pg_get_tabledef('public.' || rec.table_name) || E';\n\n';
    END LOOP;
    
    RETURN backup_content;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate database integrity
CREATE OR REPLACE FUNCTION validate_database_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check for orphaned order_items
    RETURN QUERY
    SELECT 
        'orphaned_order_items'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' order items without valid orders'::TEXT
    FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL;
    
    -- Check for orphaned products
    RETURN QUERY
    SELECT 
        'orphaned_products'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' products without valid categories'::TEXT
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.category_id IS NOT NULL AND c.id IS NULL;
    
    -- Check for missing required settings
    RETURN QUERY
    SELECT 
        'required_settings'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*) || ' settings (expected at least 5)'::TEXT
    FROM settings;
    
    -- Check for active categories without products
    RETURN QUERY
    SELECT 
        'empty_active_categories'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*) || ' active categories without products'::TEXT
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    WHERE c.is_active = true 
    AND p.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. SAMPLE MIGRATIONS
-- ============================================================================

-- Record initial schema as migration 001
SELECT record_migration(
    '001_initial_schema',
    'Initial database schema with all core tables',
    'Initial schema already applied',
    NULL
);

-- Example migration for adding a new column (commented out)
/*
-- Migration 002: Add delivery instructions to orders
SELECT record_migration(
    '002_add_delivery_instructions',
    'Add delivery_instructions column to orders table',
    'ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;',
    'ALTER TABLE orders DROP COLUMN delivery_instructions;'
);
*/

-- ============================================================================
-- 6. MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_all_tables()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(rec.table_name);
        RAISE NOTICE 'Analyzed table: %', rec.table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum all tables
CREATE OR REPLACE FUNCTION vacuum_all_tables()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE 'VACUUM ANALYZE ' || quote_ident(rec.table_name);
        RAISE NOTICE 'Vacuumed table: %', rec.table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SHOW CURRENT STATUS
-- ============================================================================

-- Show migration system status
SELECT 'Migration system initialized successfully' as status;
SELECT * FROM get_migration_status();

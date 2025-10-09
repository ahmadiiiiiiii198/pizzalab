-- ============================================================================
-- COMPREHENSIVE DATABASE STUDY SCRIPT FOR PIZZALAB
-- ============================================================================
-- This script provides a complete analysis of the database structure,
-- data, relationships, security, and functionality to ensure nothing is missed
-- Run this on the OLD database to get complete information
-- ============================================================================

-- Set output formatting for better readability
\pset border 2
\pset format aligned

-- ============================================================================
-- 1. DATABASE OVERVIEW AND METADATA
-- ============================================================================

SELECT '=== DATABASE OVERVIEW ===' as section;

-- Basic database information
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    NOW() as analysis_timestamp;

-- Database size and statistics
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as total_database_size,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT count(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_functions,
    (SELECT count(*) FROM information_schema.views WHERE table_schema = 'public') as total_views;

-- ============================================================================
-- 2. COMPLETE TABLE ANALYSIS
-- ============================================================================

SELECT '=== COMPLETE TABLE STRUCTURE ===' as section;

-- List all tables with detailed information
SELECT 
    t.table_name,
    t.table_type,
    pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) as table_size,
    pg_stat_get_tuples_inserted(c.oid) as total_inserts,
    pg_stat_get_tuples_updated(c.oid) as total_updates,
    pg_stat_get_tuples_deleted(c.oid) as total_deletes,
    COALESCE(psut.n_live_tup, 0) as live_rows,
    COALESCE(psut.n_dead_tup, 0) as dead_rows,
    obj_description(c.oid) as table_comment
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_stat_user_tables psut ON psut.relname = t.table_name
WHERE t.table_schema = 'public'
ORDER BY pg_total_relation_size('public.' || t.table_name) DESC;

-- ============================================================================
-- 3. DETAILED COLUMN ANALYSIS
-- ============================================================================

SELECT '=== COMPLETE COLUMN STRUCTURE ===' as section;

-- All columns with complete details
SELECT 
    c.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    c.udt_name,
    col_description(pgc.oid, c.ordinal_position) as column_comment,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PK'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FK'
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UQ'
        WHEN tc.constraint_type = 'CHECK' THEN 'CK'
        ELSE ''
    END as constraint_type
FROM information_schema.columns c
LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- ============================================================================
-- 4. RELATIONSHIPS AND CONSTRAINTS
-- ============================================================================

SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

-- All foreign key relationships
SELECT 
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

SELECT '=== ALL CONSTRAINTS ===' as section;

-- All constraints (PRIMARY KEY, UNIQUE, CHECK, etc.)
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, cc.check_clause
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================================================
-- 5. INDEXES ANALYSIS
-- ============================================================================

SELECT '=== COMPLETE INDEX ANALYSIS ===' as section;

-- All indexes with detailed information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    COALESCE(psui.idx_scan, 0) as index_scans,
    COALESCE(psui.idx_tup_read, 0) as tuples_read,
    COALESCE(psui.idx_tup_fetch, 0) as tuples_fetched
FROM pg_indexes pi
LEFT JOIN pg_stat_user_indexes psui ON psui.indexrelname = pi.indexname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ============================================================================
-- 6. FUNCTIONS AND PROCEDURES
-- ============================================================================

SELECT '=== ALL FUNCTIONS AND PROCEDURES ===' as section;

-- All functions with complete details
SELECT 
    r.routine_name,
    r.routine_type,
    r.data_type as return_type,
    r.routine_definition,
    r.external_language,
    r.security_type,
    r.is_deterministic,
    obj_description(p.oid) as function_comment,
    pg_get_function_arguments(p.oid) as function_arguments,
    pg_get_function_result(p.oid) as function_result
FROM information_schema.routines r
LEFT JOIN pg_proc p ON p.proname = r.routine_name
WHERE r.routine_schema = 'public'
    AND r.routine_name NOT LIKE 'pg_%'
ORDER BY r.routine_name;

-- ============================================================================
-- 7. TRIGGERS ANALYSIS
-- ============================================================================

SELECT '=== ALL TRIGGERS ===' as section;

-- All triggers
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing,
    t.action_statement,
    t.action_orientation,
    t.action_condition
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
ORDER BY t.event_object_table, t.trigger_name;

-- ============================================================================
-- 8. VIEWS ANALYSIS
-- ============================================================================

SELECT '=== ALL VIEWS ===' as section;

-- All views
SELECT 
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 9. ENUMS AND CUSTOM TYPES
-- ============================================================================

SELECT '=== CUSTOM TYPES AND ENUMS ===' as section;

-- All custom types
SELECT 
    t.typname as type_name,
    t.typtype as type_type,
    CASE 
        WHEN t.typtype = 'e' THEN 
            (SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) 
             FROM pg_enum e WHERE e.enumtypid = t.oid)
        ELSE NULL
    END as enum_values,
    obj_description(t.oid) as type_comment
FROM pg_type t
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND t.typtype IN ('e', 'c', 'd')
ORDER BY t.typname;

-- ============================================================================
-- 10. ROW LEVEL SECURITY ANALYSIS
-- ============================================================================

SELECT '=== ROW LEVEL SECURITY STATUS ===' as section;

-- RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '=== RLS POLICIES ===' as section;

-- All RLS policies
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 11. STORAGE ANALYSIS (SUPABASE SPECIFIC)
-- ============================================================================

SELECT '=== STORAGE BUCKETS ===' as section;

-- Storage buckets (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buckets' AND table_schema = 'storage') THEN
        PERFORM 1;
        -- This will be executed if storage.buckets exists
    END IF;
END $$;

-- Try to get storage buckets information
SELECT 
    id,
    name,
    owner,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
ORDER BY name;

-- Storage objects summary
SELECT 
    bucket_id,
    COUNT(*) as object_count,
    pg_size_pretty(SUM(COALESCE(metadata->>'size', '0')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- ============================================================================
-- 12. DATA ANALYSIS - CRITICAL TABLES
-- ============================================================================

SELECT '=== SETTINGS DATA ANALYSIS ===' as section;

-- Settings table analysis
SELECT 
    key,
    CASE 
        WHEN key LIKE '%password%' OR key LIKE '%secret%' OR key LIKE '%key%' 
        THEN '[HIDDEN FOR SECURITY]'
        WHEN length(value::text) > 200 
        THEN left(value::text, 200) || '...[TRUNCATED]'
        ELSE value::text
    END as value_preview,
    jsonb_typeof(value) as value_type,
    created_at,
    updated_at
FROM settings
ORDER BY key;

SELECT '=== CATEGORIES DATA ANALYSIS ===' as section;

-- Categories analysis
SELECT 
    id,
    name,
    slug,
    description,
    is_active,
    COALESCE(aggiunti_enabled, true) as aggiunti_enabled,
    COALESCE(bevande_enabled, true) as bevande_enabled,
    COALESCE(impasto_enabled, true) as impasto_enabled,
    sort_order,
    created_at
FROM categories
ORDER BY sort_order, name;

SELECT '=== PRODUCTS DATA ANALYSIS ===' as section;

-- Products summary
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count,
    COUNT(CASE WHEN p.is_active THEN 1 END) as active_products,
    AVG(p.price) as avg_price,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY c.name;

SELECT '=== FEATURE TYPES DATA ANALYSIS ===' as section;

-- Feature types analysis (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_types') THEN
        RAISE NOTICE 'Feature types table exists';
    END IF;
END $$;

SELECT 
    name,
    slug,
    description,
    table_name,
    is_active,
    has_categories,
    has_price,
    has_size,
    custom_fields,
    sort_order
FROM feature_types
ORDER BY sort_order, name;

SELECT '=== AGGIUNTI TYPES DATA ANALYSIS ===' as section;

-- Aggiunti types analysis (if exists)
SELECT 
    category,
    COUNT(*) as count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM aggiunti_types
WHERE is_active = true
GROUP BY category
ORDER BY category;

SELECT '=== ORDERS DATA ANALYSIS ===' as section;

-- Orders summary
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================================================
-- 13. PERFORMANCE ANALYSIS
-- ============================================================================

SELECT '=== TABLE PERFORMANCE STATISTICS ===' as section;

-- Table performance statistics
SELECT 
    schemaname,
    relname as table_name,
    seq_scan as sequential_scans,
    seq_tup_read as seq_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as idx_tuples_fetched,
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
ORDER BY (seq_scan + idx_scan) DESC;

-- ============================================================================
-- 14. SECURITY ANALYSIS
-- ============================================================================

SELECT '=== DATABASE ROLES AND PERMISSIONS ===' as section;

-- Database roles
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolconnlimit,
    rolvaliduntil
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;

-- Table permissions
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- 15. EXTENSIONS AND CONFIGURATION
-- ============================================================================

SELECT '=== INSTALLED EXTENSIONS ===' as section;

-- Installed extensions
SELECT 
    extname as extension_name,
    extversion as version,
    nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY extname;

-- ============================================================================
-- 16. MIGRATION AND VERSION TRACKING
-- ============================================================================

SELECT '=== MIGRATION HISTORY ===' as section;

-- Migration history (if migrations table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN
        RAISE NOTICE 'Migrations table exists';
    END IF;
END $$;

SELECT 
    migration_name,
    description,
    applied_at,
    applied_by,
    status,
    execution_time_ms
FROM migrations
ORDER BY applied_at DESC;

-- ============================================================================
-- 17. FINAL SUMMARY AND RECOMMENDATIONS
-- ============================================================================

SELECT '=== DATABASE SUMMARY ===' as section;

-- Final summary
SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Total Functions',
    COUNT(*)::text
FROM information_schema.routines 
WHERE routine_schema = 'public'

UNION ALL

SELECT 
    'Total Indexes',
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Total Constraints',
    COUNT(*)::text
FROM information_schema.table_constraints 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'RLS Enabled Tables',
    COUNT(*)::text
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public' AND pc.relrowsecurity = true

UNION ALL

SELECT 
    'Storage Buckets',
    COUNT(*)::text
FROM storage.buckets

UNION ALL

SELECT 
    'Total Settings',
    COUNT(*)::text
FROM settings;

-- ============================================================================
-- 18. EXPORT SCHEMA STRUCTURE
-- ============================================================================

SELECT '=== SCHEMA EXPORT COMMANDS ===' as section;

-- Generate pg_dump commands for schema export
SELECT 
    'pg_dump --schema-only --no-owner --no-privileges ' || current_database() || ' > schema_backup.sql' as schema_backup_command,
    'pg_dump --data-only --no-owner --no-privileges ' || current_database() || ' > data_backup.sql' as data_backup_command,
    'pg_dump --no-owner --no-privileges ' || current_database() || ' > full_backup.sql' as full_backup_command;

-- ============================================================================
-- END OF COMPREHENSIVE DATABASE STUDY
-- ============================================================================

SELECT '=== ANALYSIS COMPLETE ===' as section;
SELECT 'Database analysis completed at: ' || NOW() as completion_message;
SELECT 'Review all sections above to ensure complete database understanding' as recommendation;

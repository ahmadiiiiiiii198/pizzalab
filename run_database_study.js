import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Original database configuration
const OLD_DATABASE_URL = 'https://foymsziaullphulzhmxy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(OLD_DATABASE_URL, SUPABASE_KEY);

console.log('🔍 COMPREHENSIVE DATABASE STUDY TOOL');
console.log('=====================================');
console.log(`📊 Analyzing database: ${OLD_DATABASE_URL}`);
console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

// ============================================================================
// DATABASE ANALYSIS QUERIES
// ============================================================================

const analysisQueries = {
  // Basic database info
  basicInfo: `
    SELECT 
      current_database() as database_name,
      current_user as current_user,
      NOW() as analysis_timestamp
  `,

  // Table overview
  tableOverview: `
    SELECT 
      table_name,
      table_type,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    ORDER BY table_name
  `,

  // Column details
  columnDetails: `
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
    ORDER BY table_name, ordinal_position
  `,

  // Foreign key relationships
  foreignKeys: `
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
    ORDER BY tc.table_name, kcu.column_name
  `,

  // All constraints
  constraints: `
    SELECT 
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
    GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
    ORDER BY tc.table_name, tc.constraint_type
  `,

  // Functions
  functions: `
    SELECT 
      routine_name,
      routine_type,
      data_type as return_type,
      external_language,
      security_type,
      is_deterministic
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name NOT LIKE 'pg_%'
    ORDER BY routine_name
  `,

  // Triggers
  triggers: `
    SELECT 
      trigger_name,
      event_manipulation,
      event_object_table,
      action_timing,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `,

  // Custom types and enums
  customTypes: `
    SELECT 
      t.typname as type_name,
      t.typtype as type_type,
      CASE 
        WHEN t.typtype = 'e' THEN 
          (SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) 
           FROM pg_enum e WHERE e.enumtypid = t.oid)
        ELSE NULL
      END as enum_values
    FROM pg_type t
    WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND t.typtype IN ('e', 'c', 'd')
    ORDER BY t.typname
  `,

  // RLS status
  rlsStatus: `
    SELECT 
      schemaname,
      tablename,
      CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
    FROM pg_tables pt
    JOIN pg_class pc ON pc.relname = pt.tablename
    WHERE schemaname = 'public'
    ORDER BY tablename
  `,

  // Settings data
  settingsData: `
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
    ORDER BY key
  `,

  // Categories data
  categoriesData: `
    SELECT 
      id,
      name,
      slug,
      description,
      is_active,
      sort_order,
      created_at
    FROM categories
    ORDER BY sort_order, name
  `,

  // Feature types (if exists)
  featureTypes: `
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
    ORDER BY sort_order, name
  `,

  // Aggiunti types (if exists)
  aggiuntiTypes: `
    SELECT 
      category,
      COUNT(*) as count,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price
    FROM aggiunti_types
    WHERE is_active = true
    GROUP BY category
    ORDER BY category
  `
};

// ============================================================================
// EXECUTION FUNCTIONS
// ============================================================================

async function executeQuery(queryName, query) {
  try {
    console.log(`🔍 Executing: ${queryName}`);
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: query.trim() 
    });

    if (error) {
      console.log(`   ⚠️  Query failed: ${error.message}`);
      return { queryName, error: error.message, data: null };
    }

    console.log(`   ✅ Success: ${data?.length || 0} rows returned`);
    return { queryName, error: null, data };

  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return { queryName, error: err.message, data: null };
  }
}

async function getStorageBuckets() {
  try {
    console.log('🔍 Fetching storage buckets');
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log(`   ⚠️  Storage query failed: ${error.message}`);
      return { queryName: 'storageBuckets', error: error.message, data: null };
    }

    console.log(`   ✅ Success: ${data?.length || 0} buckets found`);
    return { queryName: 'storageBuckets', error: null, data };

  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return { queryName: 'storageBuckets', error: err.message, data: null };
  }
}

async function runComprehensiveAnalysis() {
  const results = {};
  
  console.log('\n📊 STARTING COMPREHENSIVE DATABASE ANALYSIS');
  console.log('=============================================\n');

  // Execute all queries
  for (const [queryName, query] of Object.entries(analysisQueries)) {
    const result = await executeQuery(queryName, query);
    results[queryName] = result;
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Get storage buckets
  const storageResult = await getStorageBuckets();
  results.storageBuckets = storageResult;

  return results;
}

function generateSummaryReport(results) {
  console.log('\n📋 ANALYSIS SUMMARY REPORT');
  console.log('===========================\n');

  const summary = {
    timestamp: new Date().toISOString(),
    database_url: OLD_DATABASE_URL,
    analysis_results: {}
  };

  // Process each result
  for (const [queryName, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${queryName}: FAILED - ${result.error}`);
      summary.analysis_results[queryName] = { status: 'failed', error: result.error };
    } else {
      const rowCount = result.data?.length || 0;
      console.log(`✅ ${queryName}: SUCCESS - ${rowCount} rows`);
      summary.analysis_results[queryName] = { 
        status: 'success', 
        row_count: rowCount,
        data: result.data 
      };
    }
  }

  // Key statistics
  const tables = results.tableOverview?.data || [];
  const functions = results.functions?.data || [];
  const buckets = results.storageBuckets?.data || [];
  const settings = results.settingsData?.data || [];

  console.log('\n📊 KEY STATISTICS:');
  console.log(`   📋 Tables: ${tables.length}`);
  console.log(`   ⚙️  Functions: ${functions.length}`);
  console.log(`   🗂️  Storage Buckets: ${buckets.length}`);
  console.log(`   ⚙️  Settings: ${settings.length}`);

  // Save detailed report
  const reportFile = `database_analysis_${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportFile}`);

  return summary;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    const results = await runComprehensiveAnalysis();
    const summary = generateSummaryReport(results);

    console.log('\n🎯 ANALYSIS COMPLETE!');
    console.log('=====================');
    console.log('✅ Database structure has been thoroughly analyzed');
    console.log('📄 Use the generated JSON report for detailed comparison');
    console.log('🔄 Run the database_comparison_tool.js to compare with new database');

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute the analysis
main().catch(console.error);

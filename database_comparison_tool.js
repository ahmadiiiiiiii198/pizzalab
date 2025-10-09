import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Configuration for both databases
const OLD_DATABASE = {
  url: 'https://foymsziaullphulzhmxy.supabase.co', // Original database
  key: process.env.VITE_SUPABASE_ANON_KEY
};

const NEW_DATABASE = {
  url: 'https://jncuwwavffepnajxvjxq.supabase.co', // New database
  key: process.env.VITE_SUPABASE_ANON_KEY
};

if (!OLD_DATABASE.key || !NEW_DATABASE.key) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_ANON_KEY is set in .env');
  process.exit(1);
}

const oldSupabase = createClient(OLD_DATABASE.url, OLD_DATABASE.key);
const newSupabase = createClient(NEW_DATABASE.url, NEW_DATABASE.key);

// ============================================================================
// COMPREHENSIVE DATABASE COMPARISON TOOL
// ============================================================================

console.log('🔍 COMPREHENSIVE DATABASE COMPARISON TOOL');
console.log('==========================================\n');

async function runQuery(supabase, query, description) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) {
      console.error(`❌ Error in ${description}:`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`❌ Exception in ${description}:`, err.message);
    return null;
  }
}

async function getTableList(supabase) {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error getting table list:', err.message);
    return [];
  }
}

async function getTableStructure(supabase, tableName) {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = '${tableName}'
    ORDER BY ordinal_position
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Error getting structure for ${tableName}:`, err.message);
    return [];
  }
}

async function getRowCount(supabase, tableName) {
  const query = `SELECT COUNT(*) as count FROM ${tableName}`;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) throw error;
    return data?.[0]?.count || 0;
  } catch (err) {
    console.error(`Error getting row count for ${tableName}:`, err.message);
    return 0;
  }
}

async function getFunctionList(supabase) {
  const query = `
    SELECT routine_name, routine_type, external_language
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name NOT LIKE 'pg_%'
    ORDER BY routine_name
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error getting function list:', err.message);
    return [];
  }
}

async function getStorageBuckets(supabase) {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error getting storage buckets:', err.message);
    return [];
  }
}

async function compareTableStructures(oldTables, newTables) {
  console.log('📊 COMPARING TABLE STRUCTURES');
  console.log('==============================\n');

  const oldTableNames = oldTables.map(t => t.table_name);
  const newTableNames = newTables.map(t => t.table_name);

  // Find missing tables
  const missingInNew = oldTableNames.filter(name => !newTableNames.includes(name));
  const extraInNew = newTableNames.filter(name => !oldTableNames.includes(name));

  if (missingInNew.length > 0) {
    console.log('❌ TABLES MISSING IN NEW DATABASE:');
    missingInNew.forEach(table => console.log(`   - ${table}`));
    console.log();
  }

  if (extraInNew.length > 0) {
    console.log('➕ EXTRA TABLES IN NEW DATABASE:');
    extraInNew.forEach(table => console.log(`   - ${table}`));
    console.log();
  }

  // Compare common tables
  const commonTables = oldTableNames.filter(name => newTableNames.includes(name));
  console.log(`🔍 COMPARING ${commonTables.length} COMMON TABLES:\n`);

  for (const tableName of commonTables) {
    console.log(`📋 Analyzing table: ${tableName}`);
    
    const oldStructure = await getTableStructure(oldSupabase, tableName);
    const newStructure = await getTableStructure(newSupabase, tableName);
    
    const oldRowCount = await getRowCount(oldSupabase, tableName);
    const newRowCount = await getRowCount(newSupabase, tableName);

    // Compare column structures
    const oldColumns = oldStructure.map(c => c.column_name);
    const newColumns = newStructure.map(c => c.column_name);

    const missingColumns = oldColumns.filter(col => !newColumns.includes(col));
    const extraColumns = newColumns.filter(col => !oldColumns.includes(col));

    if (missingColumns.length > 0 || extraColumns.length > 0) {
      console.log(`   ⚠️  Structure differences found:`);
      if (missingColumns.length > 0) {
        console.log(`      Missing columns: ${missingColumns.join(', ')}`);
      }
      if (extraColumns.length > 0) {
        console.log(`      Extra columns: ${extraColumns.join(', ')}`);
      }
    } else {
      console.log(`   ✅ Structure matches`);
    }

    console.log(`   📊 Row counts: Old=${oldRowCount}, New=${newRowCount}`);
    
    if (oldRowCount !== newRowCount) {
      console.log(`   ⚠️  Row count mismatch!`);
    }
    
    console.log();
  }

  return {
    missingTables: missingInNew,
    extraTables: extraInNew,
    commonTables: commonTables.length,
    totalOld: oldTableNames.length,
    totalNew: newTableNames.length
  };
}

async function compareFunctions(oldFunctions, newFunctions) {
  console.log('⚙️  COMPARING FUNCTIONS');
  console.log('=======================\n');

  const oldFunctionNames = oldFunctions.map(f => f.routine_name);
  const newFunctionNames = newFunctions.map(f => f.routine_name);

  const missingFunctions = oldFunctionNames.filter(name => !newFunctionNames.includes(name));
  const extraFunctions = newFunctionNames.filter(name => !oldFunctionNames.includes(name));

  if (missingFunctions.length > 0) {
    console.log('❌ FUNCTIONS MISSING IN NEW DATABASE:');
    missingFunctions.forEach(func => console.log(`   - ${func}`));
    console.log();
  }

  if (extraFunctions.length > 0) {
    console.log('➕ EXTRA FUNCTIONS IN NEW DATABASE:');
    extraFunctions.forEach(func => console.log(`   - ${func}`));
    console.log();
  }

  console.log(`📊 Function Summary:`);
  console.log(`   Old Database: ${oldFunctionNames.length} functions`);
  console.log(`   New Database: ${newFunctionNames.length} functions`);
  console.log(`   Common: ${oldFunctionNames.filter(name => newFunctionNames.includes(name)).length} functions`);
  console.log();

  return {
    missingFunctions,
    extraFunctions,
    totalOld: oldFunctionNames.length,
    totalNew: newFunctionNames.length
  };
}

async function compareStorageBuckets(oldBuckets, newBuckets) {
  console.log('🗂️  COMPARING STORAGE BUCKETS');
  console.log('=============================\n');

  const oldBucketNames = oldBuckets.map(b => b.name);
  const newBucketNames = newBuckets.map(b => b.name);

  const missingBuckets = oldBucketNames.filter(name => !newBucketNames.includes(name));
  const extraBuckets = newBucketNames.filter(name => !oldBucketNames.includes(name));

  if (missingBuckets.length > 0) {
    console.log('❌ BUCKETS MISSING IN NEW DATABASE:');
    missingBuckets.forEach(bucket => console.log(`   - ${bucket}`));
    console.log();
  }

  if (extraBuckets.length > 0) {
    console.log('➕ EXTRA BUCKETS IN NEW DATABASE:');
    extraBuckets.forEach(bucket => console.log(`   - ${bucket}`));
    console.log();
  }

  console.log(`📊 Storage Summary:`);
  console.log(`   Old Database: ${oldBucketNames.length} buckets`);
  console.log(`   New Database: ${newBucketNames.length} buckets`);
  console.log(`   Buckets: ${oldBucketNames.join(', ')}`);
  console.log();

  return {
    missingBuckets,
    extraBuckets,
    totalOld: oldBucketNames.length,
    totalNew: newBucketNames.length
  };
}

async function generateReport(comparison) {
  console.log('📋 COMPREHENSIVE COMPARISON REPORT');
  console.log('===================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    databases: {
      old: OLD_DATABASE.url,
      new: NEW_DATABASE.url
    },
    summary: {
      tables: {
        old: comparison.tables.totalOld,
        new: comparison.tables.totalNew,
        missing: comparison.tables.missingTables.length,
        extra: comparison.tables.extraTables.length,
        common: comparison.tables.commonTables
      },
      functions: {
        old: comparison.functions.totalOld,
        new: comparison.functions.totalNew,
        missing: comparison.functions.missingFunctions.length,
        extra: comparison.functions.extraFunctions.length
      },
      storage: {
        old: comparison.storage.totalOld,
        new: comparison.storage.totalNew,
        missing: comparison.storage.missingBuckets.length,
        extra: comparison.storage.extraBuckets.length
      }
    },
    details: comparison
  };

  // Save report to file
  const reportFile = 'database_comparison_report.json';
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log('✅ MIGRATION STATUS:');
  console.log(`   Tables: ${comparison.tables.missingTables.length === 0 ? '✅ Complete' : '❌ Missing ' + comparison.tables.missingTables.length}`);
  console.log(`   Functions: ${comparison.functions.missingFunctions.length === 0 ? '✅ Complete' : '❌ Missing ' + comparison.functions.missingFunctions.length}`);
  console.log(`   Storage: ${comparison.storage.missingBuckets.length === 0 ? '✅ Complete' : '❌ Missing ' + comparison.storage.missingBuckets.length}`);
  console.log();

  console.log(`📄 Detailed report saved to: ${reportFile}`);
  
  return report;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('🔄 Starting comprehensive database comparison...\n');

    // Get data from both databases
    console.log('📥 Fetching data from OLD database...');
    const oldTables = await getTableList(oldSupabase);
    const oldFunctions = await getFunctionList(oldSupabase);
    const oldBuckets = await getStorageBuckets(oldSupabase);

    console.log('📥 Fetching data from NEW database...');
    const newTables = await getTableList(newSupabase);
    const newFunctions = await getFunctionList(newSupabase);
    const newBuckets = await getStorageBuckets(newSupabase);

    console.log('✅ Data fetching complete\n');

    // Perform comparisons
    const tableComparison = await compareTableStructures(oldTables, newTables);
    const functionComparison = await compareFunctions(oldFunctions, newFunctions);
    const storageComparison = await compareStorageBuckets(oldBuckets, newBuckets);

    // Generate final report
    const finalReport = await generateReport({
      tables: tableComparison,
      functions: functionComparison,
      storage: storageComparison
    });

    // Final assessment
    const isComplete = 
      tableComparison.missingTables.length === 0 &&
      functionComparison.missingFunctions.length === 0 &&
      storageComparison.missingBuckets.length === 0;

    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('====================');
    
    if (isComplete) {
      console.log('🎉 DATABASE MIGRATION IS COMPLETE!');
      console.log('✅ All tables, functions, and storage buckets have been successfully migrated.');
    } else {
      console.log('⚠️  DATABASE MIGRATION NEEDS ATTENTION!');
      console.log('❌ Some components are missing and need to be addressed.');
    }

  } catch (error) {
    console.error('💥 Fatal error during comparison:', error.message);
    process.exit(1);
  }
}

// Run the comparison
main().catch(console.error);

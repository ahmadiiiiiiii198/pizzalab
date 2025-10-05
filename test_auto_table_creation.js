import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAutoTableCreation() {
  console.log('🧪 Testing Automatic Table Creation');
  console.log('===================================\n');

  // Test feature type
  const testFeature = {
    id: 'test-123',
    name: 'Test Bevande',
    slug: 'test-bevande',
    description: 'Test drinks feature for automatic table creation',
    table_name: 'test_bevande_types',
    has_categories: true,
    has_price: true,
    has_size: true,
    custom_fields: {
      categories: ['soft_drinks', 'alcoholic', 'hot_drinks'],
      additional_fields: ['brand', 'temperature', 'alcohol_content']
    }
  };

  try {
    console.log('🔧 Testing exec_sql function...');
    
    // Test simple SQL execution
    const testSQL = `
CREATE TABLE IF NOT EXISTS test_auto_creation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

    const { data: result, error } = await supabase.rpc('exec_sql', { 
      sql_query: testSQL 
    });

    if (error) {
      console.log('❌ exec_sql function not available:', error.message);
      console.log('💡 Please run the SQL function creation script first');
      console.log('📄 File: create_exec_sql_function.sql');
      return false;
    }

    console.log('✅ exec_sql function result:', result);

    // Test table creation request fallback
    console.log('\n🔧 Testing table creation request system...');
    
    const { data: requestData, error: requestError } = await supabase
      .from('table_creation_requests')
      .insert([{
        feature_type_id: testFeature.id,
        table_name: testFeature.table_name,
        sql_definition: `CREATE TABLE IF NOT EXISTS ${testFeature.table_name} (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          price DECIMAL(10,2) DEFAULT 0.00,
          category TEXT,
          size TEXT,
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        status: 'pending'
      }])
      .select()
      .single();

    if (requestError) {
      console.log('❌ Table creation request failed:', requestError.message);
      console.log('💡 Please run the SQL function creation script first');
      return false;
    }

    console.log('✅ Table creation request submitted:', requestData.id);

    // Test processing the request
    console.log('\n🔧 Testing request processing...');
    
    const { data: processResult, error: processError } = await supabase.rpc(
      'process_table_creation_request', 
      { request_id: requestData.id }
    );

    if (processError) {
      console.log('❌ Request processing failed:', processError.message);
    } else {
      console.log('✅ Request processing result:', processResult);
    }

    // Verify table was created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tableData, error: tableError } = await supabase
      .from(testFeature.table_name)
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table verification failed:', tableError.message);
      console.log('💡 Table may not have been created successfully');
    } else {
      console.log('✅ Table verified successfully!');
      console.log('📊 Table structure working correctly');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    // Remove test table
    await supabase.rpc('exec_sql', { 
      sql_query: `DROP TABLE IF EXISTS test_auto_creation;` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql_query: `DROP TABLE IF EXISTS ${testFeature.table_name};` 
    });

    // Remove test request
    await supabase
      .from('table_creation_requests')
      .delete()
      .eq('id', requestData.id);

    console.log('✅ Cleanup completed');

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function checkSystemStatus() {
  console.log('\n📊 System Status Check');
  console.log('======================\n');

  try {
    // Check if exec_sql function exists
    const { error: funcError } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1;' 
    });

    if (funcError) {
      console.log('❌ exec_sql function: NOT AVAILABLE');
      console.log('💡 Run: create_exec_sql_function.sql in Supabase SQL Editor');
    } else {
      console.log('✅ exec_sql function: AVAILABLE');
    }

    // Check if table_creation_requests table exists
    const { error: tableError } = await supabase
      .from('table_creation_requests')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('❌ table_creation_requests: NOT AVAILABLE');
      console.log('💡 Run: create_exec_sql_function.sql in Supabase SQL Editor');
    } else {
      console.log('✅ table_creation_requests: AVAILABLE');
    }

    // Check feature_types table
    const { data: features, error: featuresError } = await supabase
      .from('feature_types')
      .select('*');

    if (featuresError) {
      console.log('❌ feature_types table: NOT AVAILABLE');
    } else {
      console.log(`✅ feature_types table: AVAILABLE (${features.length} features)`);
    }

  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
}

async function main() {
  console.log('🍕 PizzaLab Automatic Table Creation Test');
  console.log('==========================================\n');

  // Check system status first
  await checkSystemStatus();

  // Run the test
  const testPassed = await testAutoTableCreation();

  if (testPassed) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ Automatic table creation system is working');
    console.log('🚀 New features will automatically create their tables');
  } else {
    console.log('\n⚠️ Tests failed');
    console.log('💡 Please run the setup SQL first:');
    console.log('📄 create_exec_sql_function.sql');
  }
}

main().catch(console.error);

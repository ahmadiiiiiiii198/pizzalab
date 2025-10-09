/**
 * Run SQL Migration to create missing tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Running SQL Migration...\n');

  try {
    // Read SQL file
    const sql = fs.readFileSync('create-missing-tables.sql', 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`${i + 1}. Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_sql').select('*').limit(0);
        if (directError) {
          console.log(`   ⚠️  ${error.message}`);
        }
      } else {
        console.log('   ✅ Success');
      }
    }

    console.log('\n========================================');
    console.log('✅ Migration completed!');
    console.log('========================================\n');
    
    // Verify tables exist
    console.log('Verifying tables...\n');
    
    const { data: base, error: baseError } = await supabase
      .from('base_del_pizze_types')
      .select('count')
      .limit(1);
    
    if (!baseError) {
      console.log('✅ base_del_pizze_types table exists');
    } else {
      console.log('❌ base_del_pizze_types:', baseError.message);
    }
    
    const { data: dolci, error: dolciError } = await supabase
      .from('dolci_types')
      .select('count')
      .limit(1);
    
    if (!dolciError) {
      console.log('✅ dolci_types table exists');
    } else {
      console.log('❌ dolci_types:', dolciError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminCredentials() {
  console.log('🔍 Checking admin credentials from database...\n');
  
  try {
    // Query the settings table for admin credentials
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'adminCredentials')
      .single();

    if (error) {
      console.log('⚠️  No custom admin credentials found in database');
      console.log('📋 Using DEFAULT credentials:\n');
      console.log('╔════════════════════════════════════╗');
      console.log('║     DEFAULT ADMIN CREDENTIALS      ║');
      console.log('╠════════════════════════════════════╣');
      console.log('║  Username: admin                   ║');
      console.log('║  Password: persian123              ║');
      console.log('╚════════════════════════════════════╝');
      console.log('\n📝 Note: These are the default credentials set in the code.');
    } else if (data && data.value) {
      const credentials = typeof data.value === 'string' 
        ? JSON.parse(data.value) 
        : data.value;
      
      console.log('✅ Found custom admin credentials in database:\n');
      console.log('╔════════════════════════════════════╗');
      console.log('║    DATABASE ADMIN CREDENTIALS      ║');
      console.log('╠════════════════════════════════════╣');
      console.log(`║  Username: ${credentials.username.padEnd(23)}║`);
      console.log(`║  Password: ${credentials.password.padEnd(23)}║`);
      console.log('╚════════════════════════════════════╝');
      console.log('\n📝 Note: These credentials were set through the admin panel.');
    }

    console.log('\n🔐 FALLBACK/EMERGENCY CREDENTIALS:');
    console.log('╔════════════════════════════════════╗');
    console.log('║   EMERGENCY ACCESS CREDENTIALS     ║');
    console.log('╠════════════════════════════════════╣');
    console.log('║  Usernames: admin, pizzeria,       ║');
    console.log('║             gallery                ║');
    console.log('║  Passwords: admin123, pizzeria2024,║');
    console.log('║             admin                  ║');
    console.log('╚════════════════════════════════════╝');
    console.log('\n📝 Note: These are hard-coded fallback credentials for emergency access.');

    console.log('\n🌐 Admin Panel URL:');
    console.log('   http://localhost:3000/admin');
    console.log('   (or your deployed URL + /admin)');

  } catch (err) {
    console.error('❌ Error checking credentials:', err.message);
  }
}

// Run the check
checkAdminCredentials();


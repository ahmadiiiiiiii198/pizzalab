import { exec } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env file');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql`;

console.log('🍕 Opening Supabase SQL Editor');
console.log('==============================\n');

console.log('🔗 Project URL:', supabaseUrl);
console.log('📝 SQL Editor URL:', sqlEditorUrl);

console.log('\n📋 SQL to copy and paste:');
console.log('='.repeat(60));

const sql = `-- Create impasta_types table for PizzaLab
CREATE TABLE IF NOT EXISTS impasta_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_impasta_types_slug ON impasta_types(slug);
CREATE INDEX IF NOT EXISTS idx_impasta_types_active ON impasta_types(is_active);
CREATE INDEX IF NOT EXISTS idx_impasta_types_sort_order ON impasta_types(sort_order);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_impasta_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_impasta_types_updated_at ON impasta_types;
CREATE TRIGGER trigger_update_impasta_types_updated_at
  BEFORE UPDATE ON impasta_types
  FOR EACH ROW
  EXECUTE FUNCTION update_impasta_types_updated_at();

-- Insert default impasta types
INSERT INTO impasta_types (name, slug, description, price, sort_order, is_active) VALUES
  ('Impasta Normale', 'impasta-normale', 'Impasta tradizionale della casa', 0.00, 1, true),
  ('Impasta Integrale', 'impasta-integrale', 'Impasta integrale più salutare e digeribile', 1.00, 2, true),
  ('Impasta ai Cereali', 'impasta-cereali', 'Impasta ai cereali misti per un sapore unico', 2.00, 3, true),
  ('Impasta Senza Glutine', 'impasta-senza-glutine', 'Impasta speciale per celiaci', 3.00, 4, true),
  ('Impasta alla Canapa', 'impasta-canapa', 'Impasta innovativa alla canapa', 2.50, 5, true)
ON CONFLICT (slug) DO NOTHING;`;

console.log(sql);
console.log('='.repeat(60));

console.log('\n🎯 Instructions:');
console.log('1. The SQL Editor will open in your browser');
console.log('2. Copy the SQL above');
console.log('3. Paste it in the SQL Editor');
console.log('4. Click "Run" to execute');
console.log('5. Run: node verify_impasta_table.js to verify');

console.log('\n🚀 Opening SQL Editor...');

// Open the URL in the default browser
const command = process.platform === 'win32' ? 'start' : 
               process.platform === 'darwin' ? 'open' : 'xdg-open';

exec(`${command} "${sqlEditorUrl}"`, (error) => {
  if (error) {
    console.log('❌ Could not open browser automatically');
    console.log('🔗 Please open this URL manually:', sqlEditorUrl);
  } else {
    console.log('✅ SQL Editor opened in browser');
  }
});

console.log('\n📝 After running the SQL, verify with:');
console.log('   node verify_impasta_table.js');

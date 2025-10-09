import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'productsContent')
    .single();

  console.log('\nProducts Content:');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Background:', data?.value?.backgroundImage || 'NONE');
  console.log('');
}

check().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

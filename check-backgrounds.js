import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const sections = [
  'heroContent',
  'whyChooseUsContent', 
  'flegreaPizzaContent',
  'productsContent',
  'aboutContent',
  'galleryContent',
  'servicesContent',
  'contactContent'
];

async function check() {
  console.log('\nChecking background images...\n');
  
  for (const key of sections) {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    const bg = data?.value?.backgroundImage;
    const status = bg ? 'HAS BG' : 'NO BG';
    console.log(`${status.padEnd(10)} ${key}`);
    if (bg) {
      console.log(`           ${bg.substring(0, 60)}...`);
    }
  }
  
  console.log('\nDone!\n');
}

check().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

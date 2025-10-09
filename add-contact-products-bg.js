import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const TEST_IMAGE = 'https://jncuwwavffepnajxvjxq.supabase.co/storage/v1/object/public/uploads/hero-backgrounds/aurelien-lemasson-theobald-x00czbt4dfk-unsplash_1759964394361_902t1u.jpg';

async function addBackgrounds() {
  console.log('\n🎨 Adding backgrounds to Contact and Products sections...\n');
  
  // Contact Section
  const { data: contactData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'contactContent')
    .single();
  
  const { error: contactError } = await supabase
    .from('settings')
    .update({
      value: {
        ...(contactData?.value || {}),
        backgroundImage: TEST_IMAGE
      }
    })
    .eq('key', 'contactContent');
  
  if (contactError) {
    console.log(`❌ contactContent: ${contactError.message}`);
  } else {
    console.log(`✅ contactContent: Background added`);
  }
  
  // Products Section
  const { data: productsData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'productsContent')
    .single();
  
  const { error: productsError } = await supabase
    .from('settings')
    .update({
      value: {
        ...(productsData?.value || {}),
        backgroundImage: TEST_IMAGE
      }
    })
    .eq('key', 'productsContent');
  
  if (productsError) {
    console.log(`❌ productsContent: ${productsError.message}`);
  } else {
    console.log(`✅ productsContent: Background added`);
  }
  
  console.log('\n✨ Done! Refresh your browser to see the backgrounds.\n');
}

addBackgrounds()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

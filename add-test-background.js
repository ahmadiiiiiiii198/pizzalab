import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test image URL (from hero which already works)
const TEST_IMAGE = 'https://jncuwwavffepnajxvjxq.supabase.co/storage/v1/object/public/uploads/hero-backgrounds/aurelien-lemasson-theobald-x00czbt4dfk-unsplash_1759964394361_902t1u.jpg';

async function addTestBackgrounds() {
  console.log('\n🎨 Adding test backgrounds to verify system works...\n');
  
  const sectionsToTest = [
    'aboutContent',
    'servicesContent',
    'galleryContent'
  ];
  
  for (const key of sectionsToTest) {
    // Get current setting
    const { data: current } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    
    // Update with test background
    const { error } = await supabase
      .from('settings')
      .update({
        value: {
          ...(current?.value || {}),
          backgroundImage: TEST_IMAGE
        }
      })
      .eq('key', key);
    
    if (error) {
      console.log(`❌ ${key}: ${error.message}`);
    } else {
      console.log(`✅ ${key}: Test background added`);
    }
  }
  
  console.log('\n✨ Done! Now refresh your browser and check if backgrounds appear.\n');
  console.log('💡 If they appear, the system works! You just need to upload real images.\n');
}

addTestBackgrounds()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

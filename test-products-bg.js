import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testProductsBackground() {
  console.log('\n🧪 Testing Products Section Background\n');
  console.log('='.repeat(60));
  
  // Step 1: Check database
  console.log('\n📋 Step 1: Check Database');
  console.log('-'.repeat(60));
  
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'productsContent')
    .single();

  if (error) {
    console.log('❌ Database Error:', error.message);
    return;
  }

  console.log('✅ Database query successful');
  console.log('\nFull value object:');
  console.log(JSON.stringify(data.value, null, 2));
  
  const bgImage = data.value?.backgroundImage;
  console.log('\nBackground Image:');
  console.log(bgImage ? `✅ ${bgImage}` : '❌ NOT FOUND');

  // Step 2: Test URL accessibility
  if (bgImage) {
    console.log('\n🔍 Step 2: Test Image URL');
    console.log('-'.repeat(60));
    
    try {
      const response = await fetch(bgImage, { method: 'HEAD' });
      console.log(`Status: ${response.status}`);
      console.log(`Accessible: ${response.ok ? '✅ YES' : '❌ NO'}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
    } catch (err) {
      console.log('❌ Fetch failed:', err.message);
    }
  }

  // Step 3: Simulate frontend logic
  console.log('\n🎨 Step 3: Simulate Frontend Rendering');
  console.log('-'.repeat(60));
  
  const productsContent = {
    heading: "Il Nostro Menu",
    subheading: "Scopri la nostra selezione",
    backgroundImage: "",
    ...data.value
  };

  console.log('\nproductsContent object:');
  console.log(JSON.stringify(productsContent, null, 2));

  const sectionStyle = productsContent.backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${productsContent.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  console.log('\nWill render background:', !!productsContent.backgroundImage);
  console.log('\nGenerated CSS:');
  if (productsContent.backgroundImage) {
    console.log('  backgroundImage:', sectionStyle.backgroundImage?.substring(0, 100) + '...');
    console.log('  backgroundSize:', sectionStyle.backgroundSize);
    console.log('  backgroundPosition:', sectionStyle.backgroundPosition);
    console.log('  backgroundRepeat:', sectionStyle.backgroundRepeat);
  } else {
    console.log('  (no background - empty object)');
  }

  // Step 4: Check what component would receive
  console.log('\n📦 Step 4: Component State Check');
  console.log('-'.repeat(60));
  
  console.log('\nIn ProductsEnhanced.tsx:');
  console.log('  useState initial:', { heading: "Il Nostro Menu", subheading: "...", backgroundImage: "" });
  console.log('  After database load:', productsContent);
  console.log('  Has backgroundImage:', !!productsContent.backgroundImage);
  console.log('  Style will be applied:', Object.keys(sectionStyle).length > 0 ? 'YES' : 'NO');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  if (bgImage) {
    console.log('✅ Background image EXISTS in database');
    console.log('✅ Component SHOULD render background');
    console.log('\n💡 If not showing in browser:');
    console.log('   1. Hard refresh (Ctrl+Shift+R)');
    console.log('   2. Check browser DevTools → Elements → section#products');
    console.log('   3. Look for style="background-image: ..."');
    console.log('   4. Check browser console for errors');
  } else {
    console.log('❌ Background image NOT in database');
    console.log('\n💡 To fix:');
    console.log('   1. Run: node add-contact-products-bg.js');
    console.log('   2. Or upload via Admin Panel → Backgrounds');
  }
  
  console.log('\n');
}

testProductsBackground()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('\n💥 Test failed:', e);
    process.exit(1);
  });

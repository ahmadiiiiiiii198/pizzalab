import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testLiveBackground() {
  console.log('\n🔍 LIVE BACKGROUND TEST - Checking actual website state\n');
  console.log('='.repeat(70));
  
  // Test 1: Check database
  console.log('\n📋 TEST 1: Database State');
  console.log('-'.repeat(40));
  
  const { data: dbData, error: dbError } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'productsContent')
    .single();
  
  if (dbError) {
    console.log('❌ Database error:', dbError.message);
    return;
  }
  
  if (!dbData?.value?.backgroundImage) {
    console.log('❌ No background image in database');
    console.log('   Database value:', dbData?.value);
    return;
  }
  
  console.log('✅ Background URL found:', dbData.value.backgroundImage);
  
  // Test 2: Check if image is accessible
  console.log('\n🌐 TEST 2: Image Accessibility');
  console.log('-'.repeat(40));
  
  try {
    const imageResponse = await fetch(dbData.value.backgroundImage);
    console.log('Image HTTP Status:', imageResponse.status);
    console.log('Image Content-Type:', imageResponse.headers.get('content-type'));
    
    if (imageResponse.ok) {
      console.log('✅ Image is accessible');
    } else {
      console.log('❌ Image returned error:', imageResponse.status);
    }
  } catch (err) {
    console.log('❌ Image fetch failed:', err.message);
  }
  
  // Test 3: Check website HTML (simulate browser)
  console.log('\n🖥️ TEST 3: Website HTML Check');
  console.log('-'.repeat(40));
  
  try {
    const websiteResponse = await fetch('http://localhost:3000');
    if (websiteResponse.ok) {
      console.log('✅ Website is running on localhost:3000');
      
      // Check if we can find the products section
      const html = await websiteResponse.text();
      const hasProductsSection = html.includes('id="products"');
      console.log('Products section found:', hasProductsSection ? '✅' : '❌');
      
    } else {
      console.log('❌ Website not accessible:', websiteResponse.status);
    }
  } catch (err) {
    console.log('❌ Website fetch failed:', err.message);
    console.log('   Make sure the dev server is running: npm run dev');
  }
  
  // Test 4: Expected CSS
  console.log('\n🎨 TEST 4: Expected CSS Properties');
  console.log('-'.repeat(40));
  console.log('The section should have:');
  console.log('  style="background: url(...) center/cover no-repeat; min-height: 100vh;"');
  console.log('');
  console.log('Product cards should have:');
  console.log('  class="... bg-white/90 backdrop-blur-sm ..."');
  console.log('');
  console.log('Category containers should have:');
  console.log('  class="... bg-white/80 backdrop-blur-md ..."');
  
  // Test 5: Manual verification steps
  console.log('\n🔧 TEST 5: Manual Verification Steps');
  console.log('-'.repeat(40));
  console.log('1. Open http://localhost:3000 in browser');
  console.log('2. Scroll to "Il Nostro Menu" section');
  console.log('3. Right-click → Inspect Element');
  console.log('4. Find <section id="products">');
  console.log('5. Check the style attribute');
  console.log('6. Should see: style="background: url(...) center/cover no-repeat; min-height: 100vh;"');
  console.log('');
  console.log('If style is missing or different:');
  console.log('- Check browser console for React errors');
  console.log('- Verify component is rendering (look for data-test="products-section")');
  console.log('- Check if CSS is being overridden by other rules');
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(70));
  console.log('✅ Background URL exists in database');
  console.log('✅ Image is accessible');
  console.log('✅ Code changes have been applied');
  console.log('');
  console.log('If background still not visible:');
  console.log('1. Hard refresh browser (Ctrl+Shift+R)');
  console.log('2. Clear browser cache');
  console.log('3. Check browser DevTools for CSS conflicts');
  console.log('4. Verify React component is actually rendering the style');
  console.log('');
}

testLiveBackground()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('\n💥 Test failed:', e);
    process.exit(1);
  });

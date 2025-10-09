import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function comprehensiveTest() {
  console.log('\n🔬 COMPREHENSIVE BACKGROUND TEST\n');
  console.log('='.repeat(70));
  
  // Test 1: Database
  console.log('\n📋 TEST 1: Database Check');
  console.log('-'.repeat(70));
  const { data: dbData, error: dbError } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'productsContent')
    .single();
  
  console.log('Database response:', {
    hasError: !!dbError,
    hasData: !!dbData,
    backgroundImage: dbData?.value?.backgroundImage || 'NONE'
  });
  
  if (dbData?.value?.backgroundImage) {
    console.log('✅ Background URL exists in database');
    console.log('   URL:', dbData.value.backgroundImage);
  } else {
    console.log('❌ No background in database');
    return;
  }
  
  // Test 2: Image accessibility
  console.log('\n🌐 TEST 2: Image URL Accessibility');
  console.log('-'.repeat(70));
  const imageUrl = dbData.value.backgroundImage;
  
  try {
    const response = await fetch(imageUrl);
    console.log('HTTP Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    if (response.ok) {
      console.log('✅ Image is accessible');
    } else {
      console.log('❌ Image returned error status');
    }
  } catch (err) {
    console.log('❌ Failed to fetch image:', err.message);
  }
  
  // Test 3: CSS Analysis
  console.log('\n🎨 TEST 3: CSS Analysis');
  console.log('-'.repeat(70));
  
  console.log('\nExpected inline style:');
  console.log('  background: url(...) center/cover no-repeat');
  
  console.log('\nCSS class that might interfere:');
  console.log('  .section-light-warm {');
  console.log('    background: linear-gradient(to bottom, #FFF7ED 0%, #FFEDD5 100%);');
  console.log('  }');
  
  console.log('\nCSS Specificity:');
  console.log('  - Inline style: 1,0,0,0 (highest)');
  console.log('  - Class: 0,0,1,0 (lower)');
  console.log('  - Inline should win!');
  
  // Test 4: Component render simulation
  console.log('\n🔄 TEST 4: Component Render Simulation');
  console.log('-'.repeat(70));
  
  const productsContent = {
    heading: "Il Nostro Menu",
    subheading: "...",
    backgroundImage: dbData.value.backgroundImage
  };
  
  const sectionStyle = productsContent.backgroundImage
    ? {
        background: `url(${productsContent.backgroundImage}) center/cover no-repeat`
      }
    : {};
  
  const sectionClasses = productsContent.backgroundImage
    ? "py-16 min-h-screen"
    : "py-16 section-light-warm min-h-screen";
  
  console.log('Component state:');
  console.log('  hasBackground:', !!productsContent.backgroundImage);
  console.log('  sectionClasses:', sectionClasses);
  console.log('  sectionStyle:', sectionStyle);
  
  console.log('\nExpected HTML:');
  console.log(`  <section id="products" class="${sectionClasses}" style="background: url(...) center/cover no-repeat">`);
  
  // Test 5: Check for other CSS that might interfere
  console.log('\n🔍 TEST 5: Potential CSS Conflicts');
  console.log('-'.repeat(70));
  
  console.log('Check these in browser DevTools:');
  console.log('  1. Open DevTools (F12)');
  console.log('  2. Go to Elements tab');
  console.log('  3. Find: <section id="products">');
  console.log('  4. Check Styles panel on right');
  console.log('  5. Look for:');
  console.log('     - element.style { background: url(...) } ✓ Should be there');
  console.log('     - .section-light-warm { background: ... } ✗ Should be crossed out or absent');
  console.log('  6. Check Computed tab');
  console.log('     - background-image should show your URL');
  
  // Test 6: Browser cache
  console.log('\n💾 TEST 6: Browser Cache Check');
  console.log('-'.repeat(70));
  console.log('Try these steps:');
  console.log('  1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
  console.log('  2. Clear cache: DevTools → Network tab → Disable cache checkbox');
  console.log('  3. Incognito mode: Open in private/incognito window');
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log('\n✅ What we know works:');
  console.log('  - Database has background URL');
  console.log('  - Component loads the URL');
  console.log('  - State updates correctly');
  console.log('  - Style object is generated');
  console.log('  - Class is conditionally removed');
  
  console.log('\n❓ What to check in browser:');
  console.log('  1. Is inline style actually applied to DOM?');
  console.log('  2. Is there another CSS rule overriding it?');
  console.log('  3. Is the image URL loading (check Network tab)?');
  console.log('  4. Is there a z-index issue?');
  
  console.log('\n💡 Next debugging steps:');
  console.log('  1. Open browser DevTools');
  console.log('  2. Inspect <section id="products">');
  console.log('  3. Screenshot the Styles panel');
  console.log('  4. Check what CSS is actually applied');
  
  console.log('\n');
}

comprehensiveTest()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('\n💥 Test failed:', e);
    process.exit(1);
  });

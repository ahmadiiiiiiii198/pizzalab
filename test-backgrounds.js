/**
 * Test Background Images - Comprehensive Diagnostic
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sections = [
  'heroContent',
  'whyChooseUsContent',
  'flegreaPizzaContent',
  'productsContent',
  'aboutContent',
  'galleryContent',
  'servicesContent',
  'contactContent',
  'youtubeSectionContent'
];

async function testBackgrounds() {
  console.log('🧪 BACKGROUND IMAGES DIAGNOSTIC TEST\n');
  console.log('='.repeat(70));
  
  // Test 1: Check database settings
  console.log('\n📋 TEST 1: Database Settings Check');
  console.log('-'.repeat(70));
  
  for (const sectionKey of sections) {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', sectionKey)
      .single();

    if (error) {
      console.log(`❌ ${sectionKey}: ERROR - ${error.message}`);
    } else if (!data) {
      console.log(`⚠️  ${sectionKey}: NOT FOUND`);
    } else {
      const bgImage = data.value?.backgroundImage;
      if (bgImage) {
        console.log(`✅ ${sectionKey}: HAS BACKGROUND`);
        console.log(`   URL: ${bgImage.substring(0, 80)}...`);
      } else {
        console.log(`📭 ${sectionKey}: NO BACKGROUND (empty)`);
      }
    }
  }

  // Test 2: Check image accessibility
  console.log('\n\n🔍 TEST 2: Image URL Accessibility');
  console.log('-'.repeat(70));
  
  for (const sectionKey of sections) {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', sectionKey)
      .single();

    const bgImage = data?.value?.backgroundImage;
    if (bgImage) {
      try {
        const response = await fetch(bgImage, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ ${sectionKey}: Image accessible (${response.status})`);
        } else {
          console.log(`❌ ${sectionKey}: Image NOT accessible (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${sectionKey}: Fetch failed - ${error.message}`);
      }
    }
  }

  // Test 3: Check data structure
  console.log('\n\n📦 TEST 3: Data Structure Validation');
  console.log('-'.repeat(70));
  
  const { data: heroData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'heroContent')
    .single();

  console.log('\nHero Content Structure:');
  console.log(JSON.stringify(heroData?.value, null, 2));

  // Test 4: Simulate frontend fetch
  console.log('\n\n🎨 TEST 4: Simulate Frontend Fetch');
  console.log('-'.repeat(70));
  
  const { data: allSettings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', sections);

  console.log(`\nFetched ${allSettings?.length || 0} settings`);
  
  allSettings?.forEach(setting => {
    const bgImage = setting.value?.backgroundImage;
    console.log(`\n${setting.key}:`);
    console.log(`  Has backgroundImage field: ${bgImage !== undefined}`);
    console.log(`  Value: ${bgImage || '(empty)'}`);
    console.log(`  Type: ${typeof bgImage}`);
  });

  // Test 5: Check what frontend would receive
  console.log('\n\n🖥️  TEST 5: Frontend Rendering Simulation');
  console.log('-'.repeat(70));
  
  for (const sectionKey of sections) {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', sectionKey)
      .single();

    const bgImage = data?.value?.backgroundImage;
    
    // Simulate what frontend does
    const sectionStyle = bgImage
      ? {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      : {};

    console.log(`\n${sectionKey}:`);
    console.log(`  Will render background: ${!!bgImage}`);
    if (bgImage) {
      console.log(`  CSS backgroundImage: ${sectionStyle.backgroundImage?.substring(0, 100)}...`);
    } else {
      console.log(`  CSS: (no background)`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  
  const { data: summary } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', sections);

  const withBackground = summary?.filter(s => s.value?.backgroundImage) || [];
  const withoutBackground = summary?.filter(s => !s.value?.backgroundImage) || [];

  console.log(`\n✅ Sections WITH backgrounds: ${withBackground.length}`);
  withBackground.forEach(s => console.log(`   - ${s.key}`));

  console.log(`\n📭 Sections WITHOUT backgrounds: ${withoutBackground.length}`);
  withoutBackground.forEach(s => console.log(`   - ${s.key}`));

  console.log('\n💡 RECOMMENDATIONS:');
  if (withoutBackground.length > 0) {
    console.log('   1. Upload background images via Admin Panel → Backgrounds tab');
    console.log('   2. Each section needs an image uploaded');
  }
  if (withBackground.length > 0) {
    console.log('   3. Hard refresh browser (Ctrl+Shift+R)');
    console.log('   4. Check browser console for errors');
    console.log('   5. Verify CSS is being applied in DevTools');
  }

  console.log('\n✨ Test completed!\n');
}

testBackgrounds()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });

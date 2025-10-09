import { supabase } from '@/integrations/supabase/client';

/**
 * Test background images functionality
 */
export const testBackgroundImages = async () => {
  console.log('🧪 Testing Background Images System...\n');
  
  const results = [];
  
  // List of all sections
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

  // Test 1: Check if settings exist
  console.log('📋 Test 1: Checking settings table...');
  for (const sectionKey of sections) {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', sectionKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`❌ Error loading ${sectionKey}:`, error);
      results.push({
        section: sectionKey,
        status: 'error',
        error: error.message
      });
    } else if (!data) {
      console.log(`⚠️  ${sectionKey}: No setting found`);
      results.push({
        section: sectionKey,
        status: 'missing',
        backgroundImage: null
      });
    } else {
      const bgImage = (data.value as any)?.backgroundImage || null;
      console.log(`✅ ${sectionKey}: ${bgImage ? 'Has background' : 'No background'}`);
      console.log(`   URL: ${bgImage || 'N/A'}`);
      
      results.push({
        section: sectionKey,
        status: 'found',
        backgroundImage: bgImage,
        fullValue: data.value
      });
    }
  }

  // Test 2: Check image accessibility
  console.log('\n🔍 Test 2: Testing image URL accessibility...');
  for (const result of results) {
    if (result.backgroundImage) {
      try {
        const response = await fetch(result.backgroundImage, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ ${result.section}: Image accessible (${response.status})`);
          result.imageAccessible = true;
        } else {
          console.log(`❌ ${result.section}: Image not accessible (${response.status})`);
          result.imageAccessible = false;
        }
      } catch (error) {
        console.log(`❌ ${result.section}: Failed to fetch image`, error);
        result.imageAccessible = false;
      }
    }
  }

  // Test 3: Check storage bucket
  console.log('\n📦 Test 3: Checking storage bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('uploads')
    .list('section-backgrounds');

  if (listError) {
    console.error('❌ Failed to list files:', listError);
  } else {
    console.log(`✅ Found ${files?.length || 0} files in section-backgrounds folder`);
    files?.forEach(file => {
      console.log(`   - ${file.name} (${(file.metadata?.size || 0) / 1024}KB)`);
    });
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total sections: ${sections.length}`);
  console.log(`Settings found: ${results.filter(r => r.status === 'found').length}`);
  console.log(`With backgrounds: ${results.filter(r => r.backgroundImage).length}`);
  console.log(`Accessible images: ${results.filter(r => r.imageAccessible).length}`);

  return results;
};

/**
 * Fix background image URLs
 */
export const fixBackgroundUrls = async () => {
  console.log('🔧 Fixing background image URLs...\n');

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

  for (const sectionKey of sections) {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', sectionKey)
      .single();

    if (!error && data?.value) {
      const value = data.value as any;
      if (value.backgroundImage) {
        // Check if URL needs fixing
        const url = value.backgroundImage;
        console.log(`🔍 Checking ${sectionKey}: ${url}`);

        // Test URL
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ ${sectionKey}: URL is accessible`);
          } else {
            console.log(`❌ ${sectionKey}: URL returns ${response.status}`);
            
            // Try to fix by regenerating URL
            const pathMatch = url.match(/section-backgrounds\/(.+)$/);
            if (pathMatch) {
              const fileName = pathMatch[1];
              const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(`section-backgrounds/${fileName}`);
              
              console.log(`🔄 Regenerating URL: ${publicUrl}`);
              
              // Update setting
              const { error: updateError } = await supabase
                .from('settings')
                .update({
                  value: {
                    ...value,
                    backgroundImage: publicUrl
                  }
                })
                .eq('key', sectionKey);

              if (updateError) {
                console.error(`❌ Failed to update ${sectionKey}:`, updateError);
              } else {
                console.log(`✅ Updated ${sectionKey} with new URL`);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error testing ${sectionKey}:`, error);
        }
      }
    }
  }

  console.log('\n✅ Fix complete!');
};

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).testBackgrounds = testBackgroundImages;
  (window as any).fixBackgroundUrls = fixBackgroundUrls;
}

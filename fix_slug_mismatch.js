import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSlugMismatch() {
  console.log('🔧 Fixing slug mismatch in feature_types table');
  console.log('===============================================\n');

  try {
    // Check current feature types
    const { data: features, error: fetchError } = await supabase
      .from('feature_types')
      .select('*')
      .order('created_at');

    if (fetchError) {
      console.log('❌ Cannot access feature_types table:', fetchError.message);
      return;
    }

    console.log('📋 Current feature types:');
    features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature.name} (slug: "${feature.slug}")`);
    });

    // Check if we have 'impasta' slug that should be 'impasto'
    const impastaFeature = features.find(f => f.slug === 'impasta');
    
    if (impastaFeature) {
      console.log('\n🔧 Found "impasta" slug, updating to "impasto"...');
      
      const { error: updateError } = await supabase
        .from('feature_types')
        .update({ slug: 'impasto' })
        .eq('id', impastaFeature.id);

      if (updateError) {
        console.log('❌ Error updating slug:', updateError.message);
      } else {
        console.log('✅ Successfully updated slug from "impasta" to "impasto"');
      }
    } else {
      console.log('\n✅ No slug mismatch found - all slugs are correct');
    }

    // Verify final state
    const { data: finalFeatures } = await supabase
      .from('feature_types')
      .select('*')
      .order('created_at');

    console.log('\n📋 Final feature types:');
    finalFeatures.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature.name} (slug: "${feature.slug}")`);
    });

    console.log('\n🎯 Expected behavior:');
    console.log('   - "Impasto" tab should show ImpastaTypesManager');
    console.log('   - "Aggiunti" tab should show AggiuntiTypesManager');
    console.log('   - Other tabs show GenericFeatureManager');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function main() {
  await fixSlugMismatch();
  console.log('\n🔄 Please refresh your browser to see the changes');
}

main().catch(console.error);

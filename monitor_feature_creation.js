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

let lastCount = 0;

async function checkFeatureTypes() {
  try {
    const { data, error } = await supabase
      .from('feature_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Table not found or error:', error.message);
      console.log('💡 Please create the feature_types table first');
      return;
    }

    const currentCount = data.length;
    
    if (currentCount !== lastCount) {
      console.log(`\n🔄 Feature types count changed: ${lastCount} → ${currentCount}`);
      
      if (currentCount > lastCount) {
        const newFeatures = data.slice(0, currentCount - lastCount);
        console.log('🆕 New feature types created:');
        
        newFeatures.forEach((feature, index) => {
          console.log(`\n   ${index + 1}. ✨ ${feature.name}`);
          console.log(`      📝 Description: ${feature.description}`);
          console.log(`      🗂️  Table: ${feature.table_name}`);
          console.log(`      🏷️  Has Categories: ${feature.has_categories ? 'Yes' : 'No'}`);
          console.log(`      💰 Has Price: ${feature.has_price ? 'Yes' : 'No'}`);
          console.log(`      📏 Has Size: ${feature.has_size ? 'Yes' : 'No'}`);
          
          if (feature.custom_fields && Object.keys(feature.custom_fields).length > 0) {
            console.log(`      🔧 Custom Fields:`);
            if (feature.custom_fields.categories && feature.custom_fields.categories.length > 0) {
              console.log(`         📂 Categories: ${feature.custom_fields.categories.join(', ')}`);
            }
            if (feature.custom_fields.additional_fields && feature.custom_fields.additional_fields.length > 0) {
              console.log(`         ➕ Additional Fields: ${feature.custom_fields.additional_fields.join(', ')}`);
            }
          }
          
          console.log(`      🕐 Created: ${new Date(feature.created_at).toLocaleString()}`);
        });
        
        console.log('\n🎉 Feature creation detected successfully!');
      }
      
      lastCount = currentCount;
    }

    // Show current status
    const timestamp = new Date().toLocaleTimeString();
    process.stdout.write(`\r[${timestamp}] 👀 Monitoring... (${currentCount} feature types) `);

  } catch (error) {
    console.log('\n❌ Monitoring error:', error.message);
  }
}

async function startMonitoring() {
  console.log('🍕 PizzaLab Feature Creation Monitor');
  console.log('====================================\n');
  
  console.log('🔍 Starting real-time monitoring of feature_types table...');
  console.log('💡 Create a new feature type in the admin panel to test!');
  console.log('📍 Go to: http://localhost:3000 → Admin Panel → Caratteristiche Prodotti');
  console.log('⏹️  Press Ctrl+C to stop monitoring\n');

  // Initial check
  await checkFeatureTypes();
  
  // Monitor every 2 seconds
  const interval = setInterval(checkFeatureTypes, 2000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping monitor...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Start monitoring
startMonitoring().catch(console.error);

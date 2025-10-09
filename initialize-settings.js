/**
 * Initialize Missing Settings Script
 * Run this with: node initialize-settings.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Settings to create
const settingsToCreate = [
  {
    key: 'flegreaPizzaContent',
    value: {
      heading: 'Flegrea Pizza',
      subheading: 'La nostra specialità napoletana',
      backgroundImage: ''
    }
  },
  {
    key: 'servicesContent',
    value: {
      heading: 'I Nostri Servizi',
      subheading: 'Scopri tutti i servizi che offriamo per rendere la tua esperienza indimenticabile',
      backgroundImage: ''
    }
  },
  {
    key: 'chiSiamoContent',
    value: {
      it: {
        heading: 'Chi Siamo',
        content: 'La nostra storia e passione per la pizza italiana'
      },
      en: {
        heading: 'About Us',
        content: 'Our story and passion for Italian pizza'
      },
      backgroundImage: ''
    }
  },
  {
    key: 'whyChooseUsContent',
    value: {
      title: 'Perché scegliere Ruràl Pizza?',
      subtitle: 'Laboratorio di pizza italiana innovativa dal 2020',
      centralImage: '/placeholder-pizza-lab.jpg',
      backgroundImage: '',
      features: [
        {
          id: '1',
          icon: '🍕',
          title: 'Ingredienti Freschi',
          description: 'Solo ingredienti di prima qualità'
        },
        {
          id: '2',
          icon: '👨‍🍳',
          title: 'Maestri Pizzaioli',
          description: 'Esperienza e tradizione italiana'
        },
        {
          id: '3',
          icon: '🔥',
          title: 'Forno a Legna',
          description: 'Cottura tradizionale perfetta'
        }
      ]
    }
  },
  {
    key: 'productsContent',
    value: {
      heading: 'Il Nostro Menu',
      subheading: 'Scopri la nostra selezione di pizze, dolci, bevande e specialità preparate con ingredienti freschi',
      backgroundImage: ''
    }
  },
  {
    key: 'aboutContent',
    value: {
      heading: 'La Nostra Storia',
      subheading: 'Passione per la pizza italiana dal 2020',
      backgroundImage: '',
      backgroundColor: '#FEF7CD',
      paragraphs: [
        'Ruràl Pizza nasce dalla passione per la pizza italiana autentica e dall\'esperienza artigianale tramandata nel tempo.',
        'Ogni pizza è preparata con ingredienti freschi e di alta qualità, seguendo le migliori tradizioni italiane.'
      ]
    }
  },
  {
    key: 'galleryContent',
    value: {
      heading: 'La Nostra Galleria',
      subheading: 'Scopri le nostre creazioni e l\'atmosfera del nostro ristorante',
      backgroundImage: ''
    }
  },
  {
    key: 'contactContent',
    value: {
      heading: 'Contattaci',
      subheading: 'Siamo qui per te, vieni a trovarci o contattaci',
      backgroundImage: ''
    }
  },
  {
    key: 'youtubeSectionContent',
    value: {
      heading: 'I Nostri Video',
      subheading: 'Guarda i nostri video e scopri di più sulla nostra pizzeria',
      backgroundImage: ''
    }
  },
  {
    key: 'pizzeriaDisplayHours',
    value: {
      displayText: '12:00-14:30, 18:00-00:00'
    }
  },
  {
    key: 'shippingZoneSettings',
    value: {
      apiKey: '',
      zones: []
    }
  },
  {
    key: 'deliveryZones',
    value: {
      zones: []
    }
  }
];

async function initializeSettings() {
  console.log('🚀 Starting settings initialization...\n');
  
  const results = {
    created: [],
    existing: [],
    errors: []
  };

  for (const setting of settingsToCreate) {
    try {
      console.log(`🔍 Checking ${setting.key}...`);
      
      // Check if setting exists
      const { data: existing, error: checkError } = await supabase
        .from('settings')
        .select('key')
        .eq('key', setting.key)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Setting doesn't exist, create it
        console.log(`   ➕ Creating ${setting.key}...`);
        
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            key: setting.key,
            value: setting.value
          });

        if (insertError) {
          console.error(`   ❌ Failed to create ${setting.key}:`, insertError.message);
          results.errors.push({ key: setting.key, error: insertError.message });
        } else {
          console.log(`   ✅ Created ${setting.key}`);
          results.created.push(setting.key);
        }
      } else if (existing) {
        console.log(`   ℹ️  ${setting.key} already exists`);
        results.existing.push(setting.key);
      } else if (checkError) {
        console.error(`   ❌ Error checking ${setting.key}:`, checkError.message);
        results.errors.push({ key: setting.key, error: checkError.message });
      }
    } catch (error) {
      console.error(`   ❌ Exception for ${setting.key}:`, error.message);
      results.errors.push({ key: setting.key, error: error.message });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 INITIALIZATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${results.created.length}`);
  if (results.created.length > 0) {
    results.created.forEach(key => console.log(`   - ${key}`));
  }
  
  console.log(`\nℹ️  Already existed: ${results.existing.length}`);
  if (results.existing.length > 0) {
    results.existing.forEach(key => console.log(`   - ${key}`));
  }
  
  console.log(`\n❌ Errors: ${results.errors.length}`);
  if (results.errors.length > 0) {
    results.errors.forEach(({ key, error }) => console.log(`   - ${key}: ${error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.errors.length === 0) {
    console.log('✅ Initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to Admin Panel → Backgrounds tab');
    console.log('   2. Upload background images for each section');
    console.log('   3. Hard refresh the frontend (Ctrl+Shift+R)');
  } else {
    console.log('⚠️  Initialization completed with errors');
    console.log('   Please check the errors above and fix them manually');
  }
  
  return results;
}

// Run the script
initializeSettings()
  .then(() => {
    console.log('\n✨ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script execution failed:', error);
    process.exit(1);
  });

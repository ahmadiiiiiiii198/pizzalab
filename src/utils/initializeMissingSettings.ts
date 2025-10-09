import { supabase } from '@/integrations/supabase/client';

/**
 * Initialize all missing section settings in the database
 */
export const initializeMissingSettings = async () => {
  console.log('🔧 Initializing missing settings...\n');

  const settingsToCreate = [
    {
      key: 'flegreaPizzaContent',
      value: {
        heading: 'Flegrea Pizza',
        subheading: 'La nostra specialità',
        backgroundImage: ''
      }
    },
    {
      key: 'servicesContent',
      value: {
        heading: 'I Nostri Servizi',
        subheading: 'Scopri tutti i servizi che offriamo',
        backgroundImage: ''
      }
    },
    {
      key: 'chiSiamoContent',
      value: {
        it: {
          heading: 'Chi Siamo',
          content: 'La nostra storia'
        },
        en: {
          heading: 'About Us',
          content: 'Our story'
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
        features: []
      }
    },
    {
      key: 'productsContent',
      value: {
        heading: 'Il Nostro Menu',
        subheading: 'Scopri la nostra selezione',
        backgroundImage: ''
      }
    },
    {
      key: 'aboutContent',
      value: {
        heading: 'La Nostra Storia',
        subheading: 'Passione per la pizza italiana',
        backgroundImage: '',
        paragraphs: []
      }
    },
    {
      key: 'galleryContent',
      value: {
        heading: 'La Nostra Galleria',
        subheading: 'Scopri le nostre creazioni',
        backgroundImage: ''
      }
    },
    {
      key: 'contactContent',
      value: {
        heading: 'Contattaci',
        subheading: 'Siamo qui per te',
        backgroundImage: ''
      }
    },
    {
      key: 'youtubeSectionContent',
      value: {
        heading: 'I Nostri Video',
        subheading: 'Guarda i nostri video',
        backgroundImage: ''
      }
    }
  ];

  const results = [];

  for (const setting of settingsToCreate) {
    try {
      // Check if setting exists
      const { data: existing, error: checkError } = await supabase
        .from('settings')
        .select('key')
        .eq('key', setting.key)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Setting doesn't exist, create it
        console.log(`➕ Creating ${setting.key}...`);
        
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            key: setting.key,
            value: setting.value
          });

        if (insertError) {
          console.error(`❌ Failed to create ${setting.key}:`, insertError);
          results.push({ key: setting.key, status: 'error', error: insertError.message });
        } else {
          console.log(`✅ Created ${setting.key}`);
          results.push({ key: setting.key, status: 'created' });
        }
      } else if (existing) {
        console.log(`ℹ️  ${setting.key} already exists`);
        results.push({ key: setting.key, status: 'exists' });
      } else if (checkError) {
        console.error(`❌ Error checking ${setting.key}:`, checkError);
        results.push({ key: setting.key, status: 'error', error: checkError.message });
      }
    } catch (error) {
      console.error(`❌ Exception for ${setting.key}:`, error);
      results.push({ key: setting.key, status: 'error', error: String(error) });
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Created: ${results.filter(r => r.status === 'created').length}`);
  console.log(`Already exists: ${results.filter(r => r.status === 'exists').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);

  return results;
};

// Export for console use
if (typeof window !== 'undefined') {
  (window as any).initializeMissingSettings = initializeMissingSettings;
}

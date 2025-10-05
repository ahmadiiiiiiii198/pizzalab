import { supabase } from '@/integrations/supabase/client';
import { initializeCategories } from './initializeCategories';
import { initializeProducts } from './initializeProducts';

// Initialize settings table structure (CRITICAL - this table is missing!)
async function ensureSettingsTable(): Promise<boolean> {
  try {
    console.log('[InitDB] Ensuring settings table exists...');

    // Try to query the settings table to see if it exists
    const { error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('[InitDB] Settings table does not exist, but we cannot create it via client');
      console.log('[InitDB] Please ensure the settings table exists in your Supabase database');
    } else if (error) {
      console.log('[InitDB] Settings table check error:', error.message);
    } else {
      console.log('[InitDB] Settings table exists and is accessible');
    }

    return true;
  } catch (error) {
    console.error('[InitDB] Error ensuring settings table:', error);
    return true; // Continue anyway, table might already exist
  }
}

// Initialize content_sections table structure
async function ensureContentSectionsTable(): Promise<boolean> {
  try {
    console.log('[InitDB] Skipping content_sections initialization (not needed for pizzeria)');
    return true;
  } catch (error) {
    console.error('[InitDB] Error ensuring content_sections table:', error);
    return true; // Continue anyway
  }
}

// Initialize category content sections in the database
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('[InitDB] Starting comprehensive database initialization...');

    // Step 0a: Ensure SETTINGS table exists (CRITICAL!)
    console.log('[InitDB] Step 0a: Ensuring settings table...');
    await ensureSettingsTable();

    // Step 0b: Ensure content_sections table exists
    console.log('[InitDB] Step 0b: Ensuring content_sections table...');
    await ensureContentSectionsTable();

    // Step 1: Initialize categories first
    console.log('[InitDB] Step 1: Initializing categories...');
    const categoriesSuccess = await initializeCategories();
    if (!categoriesSuccess) {
      console.error('[InitDB] Failed to initialize categories');
      return false;
    }
    console.log('[InitDB] Categories initialized successfully');

    // Step 2: Skip product initialization to prevent recreation after deletion
    console.log('[InitDB] Step 2: Skipping product initialization to prevent recreation after deletion');
    console.log('[InitDB] Products initialization skipped successfully');

    // Step 3: Skip content sections initialization (not needed for pizzeria)
    console.log('[InitDB] Step 3: Content sections initialization skipped successfully');

    // Step 4: Initialize default settings
    console.log('[InitDB] Step 4: Initializing default settings...');
    await initializeDefaultSettings();

    return true;
  } catch (error) {
    console.error('[InitDB] Error in initializeDatabase:', error);
    return false;
  }
}

// Skip the old content sections logic and go directly to settings
async function skipOldContentSections(): Promise<boolean> {
  return true;
}

// Initialize default settings in the settings table
async function initializeDefaultSettings(): Promise<boolean> {
  try {
    console.log('[InitDB] Initializing default settings...');

    const defaultSettings = [
      {
        key: 'heroContent',
        value: {
          heading: "Pizzeria Regina 2000",
          subheading: "Autentica pizza italiana nel cuore di Torino",
          backgroundImage: "/hero-pizza-bg.jpg"
        }
      },
      {
        key: 'weOfferContent',
        value: {
          heading: "Offriamo",
          subheading: "Scopri le nostre autentiche specialità italiane",
          offers: [
            {
              id: 1,
              title: "Pizza Metro Finchi 5 Gusti",
              description: "Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un'unica creazione straordinaria. Perfetta da condividere con famiglia e amici.",
              image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
              badge: "Specialità"
            },
            {
              id: 2,
              title: "Usiamo la Farina 5 Stagioni Gusti, Alta Qualità",
              description: "Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto per pizza leggero, digeribile e incredibilmente saporito.",
              image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
              badge: "Qualità"
            },
            {
              id: 3,
              title: "Creiamo Tutti i Tipi di Pizza Italiana di Alta Qualità",
              description: "Dalla classica Margherita alle specialità gourmet, prepariamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un'autentica esperienza italiana.",
              image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
              badge: "Autentica"
            }
          ]
        }
      }
    ];

    // Insert settings ONLY if they don't exist (don't overwrite existing settings)
    for (const setting of defaultSettings) {
      // Check if setting already exists
      const { data: existingSetting } = await supabase
        .from('settings')
        .select('key')
        .eq('key', setting.key)
        .single();

      if (existingSetting) {
        console.log(`[InitDB] Setting ${setting.key} already exists, skipping to preserve user changes`);
        continue;
      }

      // Only insert if it doesn't exist
      const { error } = await supabase
        .from('settings')
        .insert(setting);

      if (error) {
        console.error(`[InitDB] Error inserting setting ${setting.key}:`, error);
      } else {
        console.log(`[InitDB] Setting ${setting.key} initialized successfully`);
      }
    }

    return true;
  } catch (error) {
    console.error('[InitDB] Error initializing default settings:', error);
    return false;
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('[InitDB] Testing database connection...');
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[InitDB] Database connection error:', error);
      return false;
    }

    console.log('[InitDB] Database connection successful');
    return true;
  } catch (error) {
    console.error('[InitDB] Database connection error:', error);
    return false;
  }
}

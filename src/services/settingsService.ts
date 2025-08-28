import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Helper function to safely parse JSON values
const safeJsonParse = <T = any>(value: any): Json => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value as Json;
    }
  }

  // For objects and arrays, ensure they're JSON-serializable
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

// Helper function to upsert settings
const upsertSetting = async (key: string, value: any) => {
  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value: value as Json,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });

  if (error) {
    console.error(`Error upserting setting ${key}:`, error);
    throw error;
  }
};



// Class implementation for settings service
class SettingsService {
  private subscribers: Record<string, Array<(value: any) => void>> = {};
  private initialized = false;
  private settingsCache: Record<string, any> = {};
  private initializationPromise: Promise<void> | null = null;
  private initializationInProgress = false;
  
  // Initialize database settings if they don't exist
  async initialize() {
    if (this.initialized) return;
    
    // Use a single initialization promise to prevent multiple concurrent initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    if (this.initializationInProgress) {
      // Wait a bit and check again to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.initialize();
    }
    
    this.initializationInProgress = true;
    this.initializationPromise = this._initialize();
    try {
      await this.initializationPromise;
    } finally {
      this.initializationInProgress = false;
    }
    return this.initializationPromise;
  }
  
  private async _initialize() {
    try {
      // Check if settings already exist before trying to insert (with timeout)
      const checkPromise = supabase
        .from('settings')
        .select('key')
        .limit(1);
      
      // Set a timeout to prevent hanging if Supabase is slow
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Settings check timed out')), 5000);
      });
      
      let existingSettingsResult;
      try {
        existingSettingsResult = await Promise.race([
          checkPromise,
          timeoutPromise
        ]);
      } catch (e) {
        console.warn("Settings check failed, proceeding anyway:", e);
        existingSettingsResult = { data: [] };
      }
      
      const existingSettings = existingSettingsResult?.data || [];
      
      // Only initialize if no settings exist
      if (!existingSettings || existingSettings.length === 0) {
        console.log("No settings found, initializing defaults");

        // Define default settings
        const defaultSettings = [
          {
            key: 'restaurantSettings',
            value: {
              totalSeats: 50,
              reservationDuration: 120,
              openingTime: "11:30",
              closingTime: "22:00",
              languages: ["it", "en", "ar", "fa"],
              defaultLanguage: "it"
            }
          },
          {
            key: 'contactContent',
            value: {
              address: "C.so Giulio Cesare, 36, 10152 Torino TO",
              phone: "+393479190907",
              email: "anilamyzyri@gmail.com",
              mapUrl: "https://maps.google.com",
              hours: "Lun-Dom: 08:00 - 19:00"
            }
          },
          {
            key: 'galleryContent',
            value: {
              heading: "La Nostra Galleria",
              subheading: ""
            }
          },
          {
            key: 'galleryImages',
            value: []
          },
          {
            key: 'logoSettings',
            value: {
              logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
              altText: "Pizzeria Senza Cipolla Torino Logo"
            }
          },
          {
            key: 'navbarLogoSettings',
            value: {
              logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
              altText: "Pizzeria Regina 2000 Navbar Logo",
              showLogo: true,
              logoSize: "medium"
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
          },
          {
            key: 'popups',
            value: []
          },
          {
            key: 'reservations',
            value: []
          }
        ];

        // Insert settings ONLY if they don't exist (same pattern as initializeDatabase.ts)
        for (const setting of defaultSettings) {
          // Check if this specific setting already exists
          const { data: existingSetting } = await supabase
            .from('settings')
            .select('key')
            .eq('key', setting.key)
            .single();

          if (existingSetting) {
            console.log(`[SettingsService] Setting ${setting.key} already exists, skipping to preserve user changes`);
            continue;
          }

          // Only insert if it doesn't exist
          const { error } = await supabase
            .from('settings')
            .insert({
              key: setting.key,
              value: safeJsonParse<Json>(setting.value),
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error(`[SettingsService] Error inserting setting ${setting.key}:`, error);
          } else {
            console.log(`[SettingsService] Setting ${setting.key} initialized successfully`);
          }
        }

        console.log("Settings initialized in database");
      } else {
        console.log("Settings already exist in database, skipping initialization");
      }
      
      // No localStorage operations - database only
      console.log('🚫 [SettingsService] localStorage operations disabled - using database only');
      
      this.initialized = true;
      
    } catch (error) {
      console.error("Error initializing settings:", error);
    } finally {
      this.initializationPromise = null;
    }
  }

  // No preloading from localStorage - database only
  private _preloadFromLocalStorage() {
    console.log('🚫 [SettingsService] localStorage preloading disabled - using database only');
    // This function is now disabled to ensure database-only fetching
  }

  // Get a setting from Supabase database ONLY (no localStorage)
  async getSetting<T>(key: string, defaultValue: T, signal?: AbortSignal): Promise<T> {
    try {
      console.log(`🔍 [SettingsService] Fetching ${key} from DATABASE ONLY (no localStorage)`);

      // FORCE FRESH FETCH FOR NAVBAR LOGO TO BYPASS CACHE ISSUES
      if (key === 'navbarLogoSettings') {
        console.log(`🔄 [SettingsService] FORCE FRESH FETCH for ${key} (bypassing cache)`);
        // Skip cache check for navbar logo to ensure fresh data
      } else {
        // First check cache to avoid unnecessary network requests
        if (this.settingsCache[key]) {
          console.log(`📋 [SettingsService] Found ${key} in memory cache`);
          return this.settingsCache[key] as T;
        }
      }

      // Fetch DIRECTLY from Supabase database (skip localStorage completely)
      console.log(`🌐 [SettingsService] Fetching ${key} from Supabase database...`);
      const fetchPromise = supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();

      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      // Set a longer timeout for mobile networks (15 seconds)
      const timeoutPromise = new Promise<{data: any; error: any}>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase request timed out')), 15000);
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      if (result.error) throw result.error;

      // Update ONLY memory cache (no localStorage)
      this.settingsCache[key] = result.data.value;
      console.log(`✅ [SettingsService] Successfully fetched ${key} from database`);
      console.log(`📄 [SettingsService] ${key} data:`, JSON.stringify(result.data.value, null, 2));

      // EXTRA DEBUG FOR NAVBAR LOGO
      if (key === 'navbarLogoSettings') {
        console.log(`🔍 [SettingsService] NAVBAR LOGO DEBUG:`);
        console.log(`   🖼️  Logo URL: ${result.data.value.logoUrl}`);
        console.log(`   📝 Alt Text: ${result.data.value.altText}`);
        console.log(`   👁️  Show Logo: ${result.data.value.showLogo}`);
        console.log(`   📏 Logo Size: ${result.data.value.logoSize}`);
      }

      return result.data.value as T;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      console.warn(`⚠️ [SettingsService] Error getting setting ${key} from database:`, error);
      return defaultValue;
    }
  }

  // Subscribe to changes for a specific key
  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    
    this.subscribers[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[key] = this.subscribers[key].filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers for a specific key (database only)
  private notifySubscribers(key: string, value: any) {
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(callback => {
        try {
          callback(value);
        } catch (e) {
          console.error(`Error in subscriber callback for ${key}:`, e);
        }
      });
    }

    // Dispatch database update events (no localStorage events)
    try {
      window.dispatchEvent(new Event('databaseUpdated'));
      window.dispatchEvent(new CustomEvent('databaseChange', { detail: { key, value } }));
    } catch (e) {
      console.warn('Error dispatching database events:', e);
    }
  }

  // localStorage sync methods removed - database only mode

  // Save content changes to DATABASE ONLY (no localStorage)
  async saveContentChanges(sectionId: string, content: any) {
    try {
      console.log(`💾 [SettingsService] Saving ${sectionId} content to DATABASE ONLY:`, content);

      // Update cache immediately
      this.settingsCache[`${sectionId}Content`] = content;

      // Save ONLY to Supabase database (no localStorage)
      try {
        // Convert content to valid JSON type
        const jsonContent = safeJsonParse<Json>(content);

        const { error } = await supabase
          .from('settings')
          .upsert({
            key: `${sectionId}Content`,
            value: jsonContent,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (error) {
          console.error(`❌ [SettingsService] Database save error for ${sectionId}Content:`, error);
          throw error;
        }

        console.log(`✅ [SettingsService] Successfully saved ${sectionId} content to database`);
      } catch (supabaseError) {
        console.error(`❌ [SettingsService] Database save for ${sectionId}Content failed:`, supabaseError);
        throw supabaseError; // Don't continue if database save fails
      }

      // Dispatch events to notify components (remove localStorage references)
      const timestamp = Date.now();
      window.dispatchEvent(new CustomEvent('databaseUpdated', {
        detail: { key: `${sectionId}Content`, timestamp }
      }));

      return true;
    } catch (error) {
      console.error(`❌ [SettingsService] Error saving ${sectionId} content:`, error);
      return false;
    }
  }

  // Update a setting in DATABASE ONLY (no localStorage)
  async updateSetting<T>(key: string, value: T): Promise<boolean> {
    try {
      console.log(`💾 [SettingsService] Updating ${key} in DATABASE ONLY:`, value);

      // Update cache immediately for fast UI response
      this.settingsCache[key] = value;

      // Update ONLY in Supabase database (no localStorage)
      try {
        // Convert value to valid JSON type
        const jsonValue = safeJsonParse<Json>(value);

        const { error } = await supabase
          .from('settings')
          .upsert({
            key,
            value: jsonValue,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (error) {
          console.error(`❌ [SettingsService] Database error updating ${key}:`, error);
          throw error;
        }

        console.log(`✅ [SettingsService] Successfully updated ${key} in database`);
      } catch (supabaseError) {
        console.error(`❌ [SettingsService] Database update for ${key} failed:`, supabaseError);
        throw supabaseError; // Don't continue if database update fails
      }

      // Clear cache for this key to ensure fresh data on next fetch
      this.clearCache(key);

      // Update cache with new value
      this.settingsCache[key] = value;

      // Notify subscribers
      this.notifySubscribers(key, value);

      return true;
    } catch (error) {
      console.error(`❌ [SettingsService] Error updating setting ${key}:`, error);
      return false;
    }
  }

  // Clear cache for a specific key or all keys
  clearCache(key?: string) {
    if (key) {
      delete this.settingsCache[key];
      console.log(`🗑️ [SettingsService] Cleared cache for ${key}`);
    } else {
      this.settingsCache = {};
      console.log(`🗑️ [SettingsService] Cleared all cache`);
    }
  }

  // Clean up subscriptions
  cleanup() {
    this.subscribers = {};
    this.settingsCache = {};
    this.initialized = false;
    this.initializationPromise = null;
    this.initializationInProgress = false;
  }
}

// Create a singleton instance
export const settingsService = new SettingsService();

// Export functions for backward compatibility
export const initializeSettings = async () => {
  await settingsService.initialize();
};

export const saveContentChanges = async (sectionId: string, content: any) => {
  return await settingsService.saveContentChanges(sectionId, content);
};

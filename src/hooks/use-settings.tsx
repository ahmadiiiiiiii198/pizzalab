import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '@/services/settingsService';
import { supabase } from '@/integrations/supabase/client';
import type { HeroContent } from '@/types/hero';

// Global subscription manager to prevent multiple subscriptions
class SettingsSubscriptionManager {
  private static instance: SettingsSubscriptionManager;
  private subscriptions = new Map<string, any>();
  private subscribers = new Map<string, Set<(value: any) => void>>();

  static getInstance(): SettingsSubscriptionManager {
    if (!SettingsSubscriptionManager.instance) {
      SettingsSubscriptionManager.instance = new SettingsSubscriptionManager();
    }
    return SettingsSubscriptionManager.instance;
  }

  subscribe(key: string, callback: (value: any) => void) {
    // Add callback to subscribers
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(key)) {
      console.log(`[SettingsManager] Creating subscription for ${key}`);
      const channel = supabase
        .channel(`settings-${key}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'settings',
          filter: `key=eq.${key}`
        }, (payload) => {
          console.log(`[SettingsManager] Received update for ${key}:`, payload);
          if (payload.new && (payload.new as any)?.value !== undefined) {
            const newValue = (payload.new as any).value;
            // Notify all subscribers
            this.subscribers.get(key)?.forEach(cb => cb(newValue));
          }
        })
        .subscribe();

      this.subscriptions.set(key, channel);
    }

    // Return unsubscribe function
    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);

        // If no more subscribers, clean up subscription
        if (keySubscribers.size === 0) {
          console.log(`[SettingsManager] Cleaning up subscription for ${key}`);
          const channel = this.subscriptions.get(key);
          if (channel) {
            supabase.removeChannel(channel);
            this.subscriptions.delete(key);
          }
          this.subscribers.delete(key);
        }
      }
    };
  }
}

const subscriptionManager = SettingsSubscriptionManager.getInstance();

// Generic hook to use any setting with type safety
export function useSetting<T>(key: string, defaultValue: T): [T, (value: T) => Promise<boolean>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Update setting function
  const updateSetting = useCallback(async (newValue: T): Promise<boolean> => {
    try {
      console.log(`[useSetting] Updating ${key} to:`, newValue);
      const success = await settingsService.updateSetting(key, newValue);
      if (success) {
        setValue(newValue);
        console.log(`[useSetting] Successfully updated ${key}`);
      } else {
        console.error(`[useSetting] Failed to update ${key}`);
      }
      return success;
    } catch (error) {
      console.error(`[useSetting] Error updating ${key}:`, error);
      return false;
    }
  }, [key]);

  // Load setting function that can be called to refresh data
  const loadSetting = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`[useSetting] Loading setting: ${key}`);

      // Add timeout to prevent hanging (reduced to 5 seconds for better UX)
      const settingPromise = settingsService.getSetting<T>(key, defaultValue);
      const timeoutPromise = new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout loading setting ${key}`)), 5000);
      });

      const setting = await Promise.race([settingPromise, timeoutPromise]);
      console.log(`[useSetting] Loaded setting ${key}:`, setting);
      setValue(setting);
    } catch (error) {
      console.error(`[useSetting] Error loading setting ${key}:`, error);
      // Use default value on error - no localStorage fallback
      console.log(`[useSetting] Using default value for ${key}:`, defaultValue);
      setValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refresh data when coming back online
      loadSetting();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadSetting]); // Fixed dependency array

  // Set up subscription using the global manager to prevent duplicates
  useEffect(() => {
    console.log(`[useSetting] Setting up subscription for ${key}`);

    const unsubscribe = subscriptionManager.subscribe(key, (newValue: T) => {
      console.log(`[useSetting] Received update for ${key}:`, newValue);
      setValue(newValue);
      // Update localStorage to keep in sync
      localStorage.setItem(key, JSON.stringify(newValue));
    });

    return unsubscribe;
  }, [key]);

  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        console.log(`[useSetting] Initializing settings service for ${key}`);
        // Initialize the settings service if needed
        await settingsService.initialize();

        // Load initial value
        await loadSetting();

        // Subscribe to changes
        const unsubscribe = settingsService.subscribe(key, (newValue) => {
          console.log(`[useSetting] Received subscription update for ${key}:`, newValue);
          setValue(newValue as T);
        });

        // Also listen for storage events
        const handleStorageEvent = (e: StorageEvent | CustomEvent) => {
          const storageEvent = e as StorageEvent;
          const customEvent = e as CustomEvent<{key: string}>;

          if (
            (storageEvent?.key === key) ||
            (customEvent?.detail?.key === key)
          ) {
            console.log(`[useSetting] Storage event detected for ${key}, reloading...`);
            loadSetting();
          }
        };

        window.addEventListener('storage', handleStorageEvent as EventListener);
        window.addEventListener('localStorageUpdated', handleStorageEvent as EventListener);

        return () => {
          unsubscribe();
          window.removeEventListener('storage', handleStorageEvent as EventListener);
          window.removeEventListener('localStorageUpdated', handleStorageEvent as EventListener);
        };
      } catch (error) {
        console.error(`[useSetting] Error initializing settings for ${key}:`, error);
        // Set default value and stop loading
        setValue(defaultValue);
        setIsLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const cleanup = initializeAndLoad();

    return () => {
      cleanup.then(cleanupFn => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      }).catch(error => {
        console.warn(`[useSetting] Error during cleanup for ${key}:`, error);
      });
    };
  }, [key, loadSetting, defaultValue]);

  // Function to update the setting - database only
  const updateValue = async (newValue: T): Promise<boolean> => {
    const success = await settingsService.updateSetting(key, newValue);

    // Update local state immediately for UI responsiveness
    if (success) {
      setValue(newValue);
    }

    return success;
  };

  return [value, updateValue, isLoading];
}

// Type-specific hooks for common settings
// Default settings constants to avoid hoisting issues
const DEFAULT_LOGO_SETTINGS = {
  logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
  altText: "Pizzeria Senza Cipolla Torino Logo",
};

const DEFAULT_NAVBAR_LOGO_SETTINGS = {
  logoUrl: "/src/assets/efes-logo.svg",
  altText: "EFES KEBAP - Ristorante Pizzeria Logo",
  showLogo: true,
  logoSize: "medium" as "small" | "medium" | "large",
};

export function useLogoSettings() {
  return useSetting('logoSettings', DEFAULT_LOGO_SETTINGS);
}

export function useNavbarLogoSettings() {
  return useSetting('navbarLogoSettings', DEFAULT_NAVBAR_LOGO_SETTINGS);
}

// Default content constants to avoid hoisting issues
const DEFAULT_HERO_CONTENT: HeroContent = {
  welcomeMessage: "BENVENUTI DA FLEGREA",
  pizzaType: "la Pizza Napoletana",
  subtitle: "ad Alta Digeribilità, anche Gluten Free!",
  openingHours: "APERTO 7 SU 7 DALLE 19",
  buttonText: "PRENOTA IL TUO TAVOLO",
  welcomeMessageFont: "montserrat",
  pizzaTypeFont: "pacifico",
  subtitleFont: "inter",
  heading: "🍕 PIZZERIA Senza Cipolla",
  subheading: "Autentica pizza italiana preparata con ingredienti freschi e forno a legna tradizionale nel cuore di Torino",
  backgroundImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  heroImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
};

// Preload hero content for faster loading with localStorage cache
let heroContentCache: HeroContent | null = null;
let heroContentPromise: Promise<HeroContent> | null = null;

const HERO_CACHE_KEY = 'heroContent_cache';
const HERO_CACHE_TIMESTAMP_KEY = 'heroContent_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const preloadHeroContent = async () => {
  if (heroContentCache || heroContentPromise) return heroContentCache;

  // Try to get from localStorage cache first
  try {
    const cachedData = localStorage.getItem(HERO_CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(HERO_CACHE_TIMESTAMP_KEY);

    if (cachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      if (age < CACHE_DURATION) {
        heroContentCache = JSON.parse(cachedData);
        console.log('[preloadHeroContent] Using cached hero content');
        return heroContentCache;
      }
    }
  } catch (error) {
    console.warn('[preloadHeroContent] Cache read failed:', error);
  }

  heroContentPromise = (async () => {
    try {
      const { settingsService } = await import('@/services/settingsService');
      await settingsService.initialize();
      const content = await settingsService.getSetting('heroContent', DEFAULT_HERO_CONTENT);
      heroContentCache = content;

      // Cache the result
      try {
        localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(content));
        localStorage.setItem(HERO_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.warn('[preloadHeroContent] Cache write failed:', error);
      }

      return content;
    } catch (error) {
      console.warn('[preloadHeroContent] Failed to preload, using default:', error);
      heroContentCache = DEFAULT_HERO_CONTENT;
      return DEFAULT_HERO_CONTENT;
    }
  })();

  return heroContentPromise;
};

// Start preloading immediately
preloadHeroContent();

export function useHeroContent(): [HeroContent, (value: HeroContent) => Promise<boolean>, boolean] {
  const [content, updateContent, isLoading] = useSetting<HeroContent>('heroContent', DEFAULT_HERO_CONTENT);

  // Use cached content if available to reduce loading time
  useEffect(() => {
    if (heroContentCache && !isLoading) {
      // Only update if the cached content is different
      if (JSON.stringify(content) !== JSON.stringify(heroContentCache)) {
        // Don't call updateContent here to avoid infinite loops
        // The useSetting hook will handle the update
      }
    }
  }, [content, isLoading]);

  return [heroContentCache || content, updateContent, isLoading] as const;
}

const DEFAULT_ABOUT_CONTENT = {
  heading: "La Nostra Storia",
  subheading: "Passione per la bellezza naturale e l'arte floreale",
  backgroundImage: "",
  backgroundColor: "#FEF7CD",
  paragraphs: [
    "Francesco Fiori & Piante nasce dalla passione per la bellezza naturale e dall'esperienza artigianale tramandata nel tempo.",
    "Dai momenti più delicati come i funerali, ai giorni più belli come i matrimoni, offriamo composizioni floreali create con amore e cura.",
    "Le nostre creazioni nascono da una profonda passione per la bellezza naturale. Solo fiori selezionati, solo eleganza made in Torino."
  ]
};

export function useAboutContent() {
  return useSetting('aboutContent', DEFAULT_ABOUT_CONTENT);
}

const DEFAULT_RESTAURANT_SETTINGS = {
  totalSeats: 50,
  reservationDuration: 120,
  openingTime: "11:30",
  closingTime: "22:00",
  languages: ["it", "en", "ar", "fa"],
  defaultLanguage: "it"
};

export function useRestaurantSettings() {
  return useSetting('restaurantSettings', DEFAULT_RESTAURANT_SETTINGS);
}

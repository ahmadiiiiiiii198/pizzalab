/**
 * Optimized Settings Service with Caching
 * Reduces database queries by implementing intelligent caching
 */

import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CachedSetting {
  value: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class OptimizedSettingsService {
  private cache = new Map<string, CachedSetting>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CRITICAL_SETTINGS_TTL = 30 * 60 * 1000; // 30 minutes for critical settings
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // Critical settings that should be cached longer
  private readonly CRITICAL_SETTINGS = [
    'heroContent',
    'logoSettings', 
    'contactContent',
    'businessHours',
    'restaurantSettings'
  ];

  /**
   * Initialize the service by preloading critical settings
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('🚀 Initializing optimized settings service...');
      
      // Preload critical settings in a single query
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', this.CRITICAL_SETTINGS);

      if (error) {
        console.error('Failed to preload critical settings:', error);
        return;
      }

      // Cache critical settings with longer TTL
      data?.forEach(setting => {
        this.setCacheItem(setting.key, setting.value, this.CRITICAL_SETTINGS_TTL);
      });

      this.isInitialized = true;
      console.log(`✅ Preloaded ${data?.length || 0} critical settings`);
    } catch (error) {
      console.error('Settings service initialization failed:', error);
    }
  }

  /**
   * Get a setting with intelligent caching
   */
  async getSetting<T>(key: string, defaultValue?: T): Promise<T> {
    // Initialize if not done yet
    await this.initialize();

    // Check cache first
    const cached = this.getCacheItem(key);
    if (cached !== null) {
      console.log(`📦 Cache hit for setting: ${key}`);
      return cached as T;
    }

    console.log(`🔍 Cache miss for setting: ${key}, fetching from database`);

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) {
        console.warn(`Setting '${key}' not found, using default value`);
        return defaultValue as T;
      }

      // Cache the result
      const ttl = this.CRITICAL_SETTINGS.includes(key) ? this.CRITICAL_SETTINGS_TTL : this.DEFAULT_TTL;
      this.setCacheItem(key, data.value, ttl);

      return data.value as T;
    } catch (error) {
      console.error(`Error fetching setting '${key}':`, error);
      return defaultValue as T;
    }
  }

  /**
   * Get multiple settings in a single query
   */
  async getMultipleSettings(keys: string[]): Promise<Record<string, any>> {
    await this.initialize();

    const result: Record<string, any> = {};
    const uncachedKeys: string[] = [];

    // Check cache for each key
    keys.forEach(key => {
      const cached = this.getCacheItem(key);
      if (cached !== null) {
        result[key] = cached;
      } else {
        uncachedKeys.push(key);
      }
    });

    // Fetch uncached keys in a single query
    if (uncachedKeys.length > 0) {
      console.log(`🔍 Fetching ${uncachedKeys.length} uncached settings:`, uncachedKeys);

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', uncachedKeys);

        if (!error && data) {
          data.forEach(setting => {
            result[setting.key] = setting.value;
            
            // Cache the result
            const ttl = this.CRITICAL_SETTINGS.includes(setting.key) ? this.CRITICAL_SETTINGS_TTL : this.DEFAULT_TTL;
            this.setCacheItem(setting.key, setting.value, ttl);
          });
        }
      } catch (error) {
        console.error('Error fetching multiple settings:', error);
      }
    }

    return result;
  }

  /**
   * Update a setting and invalidate cache
   */
  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value })
        .select();

      if (error) {
        console.error(`Error updating setting '${key}':`, error);
        return false;
      }

      // Update cache
      const ttl = this.CRITICAL_SETTINGS.includes(key) ? this.CRITICAL_SETTINGS_TTL : this.DEFAULT_TTL;
      this.setCacheItem(key, value, ttl);

      console.log(`✅ Updated setting '${key}' and refreshed cache`);
      return true;
    } catch (error) {
      console.error(`Error updating setting '${key}':`, error);
      return false;
    }
  }

  /**
   * Clear cache for a specific key or all keys
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cleared cache for setting: ${key}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all settings cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Private cache management methods
   */
  private setCacheItem(key: string, value: any, ttl: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCacheItem(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Start periodic cache cleanup
   */
  startCacheCleanup(): void {
    // Clean up expired cache every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }
}

// Export singleton instance
export const optimizedSettingsService = new OptimizedSettingsService();

// Start cache cleanup
optimizedSettingsService.startCacheCleanup();

// Export hook for React components
export function useOptimizedSetting<T>(key: string, defaultValue?: T) {
  const [value, setValue] = React.useState<T>(defaultValue as T);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      try {
        const settingValue = await optimizedSettingsService.getSetting(key, defaultValue);
        if (isMounted) {
          setValue(settingValue);
        }
      } catch (error) {
        console.error(`Error loading setting '${key}':`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSetting();

    return () => {
      isMounted = false;
    };
  }, [key, defaultValue]);

  const updateSetting = React.useCallback(async (newValue: T) => {
    const success = await optimizedSettingsService.updateSetting(key, newValue);
    if (success) {
      setValue(newValue);
    }
    return success;
  }, [key]);

  return [value, updateSetting, isLoading] as const;
}



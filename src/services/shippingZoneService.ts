// Shipping Zone Service with Google Maps API Integration
// This service manages delivery zones based on distance from restaurant

interface ShippingZoneSettings {
  enabled: boolean;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  maxDeliveryDistance: number; // in kilometers
  deliveryFee: number;
  freeDeliveryThreshold: number; // minimum order amount for free delivery
  googleMapsApiKey: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  maxDistance: number; // in km
  deliveryFee: number;
  estimatedTime: string; // e.g., "30-45 minutes"
  isActive: boolean;
}

interface AddressValidationResult {
  isValid: boolean;
  isWithinZone: boolean;
  distance: number; // in kilometers
  deliveryFee: number;
  estimatedTime: string;
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
  error?: string;
}

class ShippingZoneService {
  private settings: ShippingZoneSettings;
  private deliveryZones: DeliveryZone[];
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.settings = {
      enabled: true,
      restaurantAddress: 'C.so Giulio Cesare, 36, 10152 Torino TO',
      restaurantLat: 45.047698, // Coordinates for C.so Giulio Cesare, Torino
      restaurantLng: 7.679902,
      maxDeliveryDistance: 15, // 15km default
      deliveryFee: 5.00,
      freeDeliveryThreshold: 50.00,
      googleMapsApiKey: 'AIzaSyBkHCjFa0GKD7lJThAyFnSaeCXFDsBtJhs'
    };
    this.deliveryZones = [];
    // Initialize asynchronously but track the promise
    this.initializationPromise = this.loadSettings();
  }

  // Ensure initialization is complete before proceeding
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  private async loadSettings() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('🔄 Loading shipping settings from database...');

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'shippingZoneSettings')
        .single();

      if (!error && data && data.value) {
        // Use database values as primary, only fill missing fields with defaults
        const defaultSettings = { ...this.settings };
        this.settings = { ...defaultSettings, ...data.value };
        console.log('✅ Shipping settings loaded from database');
        console.log('🔑 API Key loaded:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');
        console.log('📊 Loaded settings:', this.settings);
      } else {
        console.log('⚠️ No shipping settings found in database, using defaults');
        console.log('🔑 Default API Key:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');
      }

      // Load delivery zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'deliveryZones')
        .single();

      if (!zonesError && zonesData && zonesData.value !== null) {
        this.deliveryZones = zonesData.value;
        console.log('✅ Delivery zones loaded from database:', this.deliveryZones.length, 'zones');

        // Clear localStorage to prevent conflicts
        localStorage.removeItem('deliveryZones');
        localStorage.removeItem('shippingZoneSettings');
      } else {
        console.log('⚠️ No delivery zones found in database');
        this.deliveryZones = [];
      }
    } catch (error) {
      console.error('Failed to load shipping zone settings:', error);
      // Only use localStorage as absolute last resort
      console.log('🔄 Attempting localStorage fallback...');
      const saved = localStorage.getItem('shippingZoneSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
        console.log('📦 Loaded settings from localStorage');
      }
      const savedZones = localStorage.getItem('deliveryZones');
      if (savedZones) {
        this.deliveryZones = JSON.parse(savedZones);
        console.log('📦 Loaded zones from localStorage:', this.deliveryZones.length, 'zones');
      }
    } finally {
      // Mark as initialized regardless of success/failure
      this.isInitialized = true;
      console.log('🏁 Service initialization completed');
    }
  }

  private async saveSettings() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('💾 Saving shipping settings and delivery zones...');
      console.log('📊 Zones to save:', this.deliveryZones.length);
      console.log('🔑 API Key to save:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');
      console.log('📊 Full settings to save:', this.settings);

      // Save settings - try update first, then insert if not exists
      const settingsUpdateResult = await supabase
        .from('settings')
        .update({
          value: this.settings,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'shippingZoneSettings')
        .select();

      if (settingsUpdateResult.error || !settingsUpdateResult.data || settingsUpdateResult.data.length === 0) {
        console.log('Settings update failed or no rows updated, trying insert:', settingsUpdateResult.error?.message || 'No rows updated');
        // If update fails or no rows were updated, try insert
        const { error: settingsInsertError } = await supabase
          .from('settings')
          .insert({
            key: 'shippingZoneSettings',
            value: this.settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (settingsInsertError) {
          console.error('❌ Failed to insert shipping settings:', settingsInsertError);
          throw settingsInsertError;
        } else {
          console.log('✅ Shipping settings inserted successfully');
          console.log('🔑 Saved API Key:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');
        }
      } else {
        console.log('✅ Settings updated successfully');
        console.log('🔑 Saved API Key:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');
        console.log('📊 Saved settings data:', settingsUpdateResult.data);
      }

      // Save delivery zones - try update first, then insert if not exists
      const zonesUpdateResult = await supabase
        .from('settings')
        .update({
          value: this.deliveryZones,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'deliveryZones')
        .select();

      if (zonesUpdateResult.error || !zonesUpdateResult.data || zonesUpdateResult.data.length === 0) {
        console.log('Zones update failed or no rows updated, trying insert:', zonesUpdateResult.error?.message || 'No rows updated');
        // If update fails or no rows were updated, try insert
        const { error: zonesInsertError } = await supabase
          .from('settings')
          .insert({
            key: 'deliveryZones',
            value: this.deliveryZones,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (zonesInsertError) {
          console.error('❌ Failed to insert delivery zones:', zonesInsertError);
          throw zonesInsertError;
        } else {
          console.log('✅ Delivery zones inserted successfully:', this.deliveryZones.length, 'zones');
        }
      } else {
        console.log('✅ Delivery zones updated successfully:', this.deliveryZones.length, 'zones');
      }

    } catch (error) {
      console.error('❌ Failed to save shipping zone settings:', error);
      // Fallback to localStorage
      localStorage.setItem('shippingZoneSettings', JSON.stringify(this.settings));
      localStorage.setItem('deliveryZones', JSON.stringify(this.deliveryZones));
      console.log('💾 Saved to localStorage as fallback');
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Geocode address using Google Maps API
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
    if (!this.settings.googleMapsApiKey) {
      console.error('❌ Google Maps API key not configured');
      console.log('📊 Current settings:', this.settings);
      throw new Error('Google Maps API key not configured. Please configure it in the admin panel.');
    }

    console.log('🗺️ Geocoding address:', address);
    console.log('🔑 Using API key:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.settings.googleMapsApiKey}`;
      console.log('🔗 Geocoding URL:', url.replace(this.settings.googleMapsApiKey, 'API_KEY_HIDDEN'));

      const response = await fetch(url);
      const data = await response.json();

      console.log('📊 Geocoding response status:', data.status);

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        console.log('✅ Geocoding successful:', result.formatted_address);
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address
        };
      } else {
        console.error('❌ Geocoding failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('❌ Geocoding network error:', error);
      return null;
    }
  }

  // Find appropriate delivery zone based on distance
  private findDeliveryZone(distance: number): DeliveryZone | null {
    const activeZones = this.deliveryZones.filter(zone => zone.isActive);
    
    for (const zone of activeZones.sort((a, b) => a.maxDistance - b.maxDistance)) {
      if (distance <= zone.maxDistance) {
        return zone;
      }
    }
    
    return null;
  }

  // Validate delivery address
  public async validateDeliveryAddress(address: string, orderAmount: number = 0): Promise<AddressValidationResult> {
    if (!this.settings.enabled) {
      return {
        isValid: true,
        isWithinZone: true,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 }
      };
    }

    try {
      // Geocode the delivery address
      const geocodeResult = await this.geocodeAddress(address);
      
      if (!geocodeResult) {
        return {
          isValid: false,
          isWithinZone: false,
          distance: 0,
          deliveryFee: 0,
          estimatedTime: 'N/A',
          formattedAddress: address,
          coordinates: { lat: 0, lng: 0 },
          error: 'Unable to find the address. Please check and try again.'
        };
      }

      // Calculate distance from restaurant
      const distance = this.calculateDistance(
        this.settings.restaurantLat,
        this.settings.restaurantLng,
        geocodeResult.lat,
        geocodeResult.lng
      );

      // Check if within maximum delivery distance
      if (distance > this.settings.maxDeliveryDistance) {
        return {
          isValid: true,
          isWithinZone: false,
          distance,
          deliveryFee: 0,
          estimatedTime: 'N/A',
          formattedAddress: geocodeResult.formattedAddress,
          coordinates: geocodeResult,
          error: `Sorry, we don't deliver to this area. Maximum delivery distance is ${this.settings.maxDeliveryDistance}km.`
        };
      }

      // Find appropriate delivery zone
      const deliveryZone = this.findDeliveryZone(distance);
      
      if (!deliveryZone) {
        return {
          isValid: true,
          isWithinZone: false,
          distance,
          deliveryFee: 0,
          estimatedTime: 'N/A',
          formattedAddress: geocodeResult.formattedAddress,
          coordinates: geocodeResult,
          error: 'No delivery zone configured for this distance.'
        };
      }

      // Calculate delivery fee (free if order amount exceeds threshold)
      const deliveryFee = orderAmount >= this.settings.freeDeliveryThreshold ? 0 : deliveryZone.deliveryFee;

      return {
        isValid: true,
        isWithinZone: true,
        distance,
        deliveryFee,
        estimatedTime: deliveryZone.estimatedTime,
        formattedAddress: geocodeResult.formattedAddress,
        coordinates: geocodeResult
      };

    } catch (error) {
      console.error('Address validation error:', error);
      return {
        isValid: false,
        isWithinZone: false,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 },
        error: 'Unable to validate address. Please try again.'
      };
    }
  }

  // Update settings
  public async updateSettings(newSettings: Partial<ShippingZoneSettings>): Promise<void> {
    console.log('🔧 updateSettings called with:', newSettings);
    console.log('🔧 Current settings before update:', this.settings);
    this.settings = { ...this.settings, ...newSettings };
    console.log('🔧 Settings after merge:', this.settings);
    console.log('🔑 API Key after merge:', this.settings.googleMapsApiKey ? 'Present' : 'Missing');

    // Use upsert for more reliable saving
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('💾 Upserting shipping settings');

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'shippingZoneSettings',
          value: this.settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ Failed to upsert shipping settings:', error);
        throw error;
      }

      console.log('✅ Shipping settings upserted successfully');
    } catch (error) {
      console.error('❌ Error upserting shipping settings:', error);
      // Fallback to the old save method
      await this.saveSettings();
    }

    console.log('✅ Settings update and save completed');
  }

  // Update delivery zones
  public async updateDeliveryZones(zones: DeliveryZone[]): Promise<void> {
    this.deliveryZones = zones;

    // Use upsert for more reliable saving
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      console.log('💾 Upserting delivery zones:', zones.length, 'zones');

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'deliveryZones',
          value: this.deliveryZones,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ Failed to upsert delivery zones:', error);
        throw error;
      }

      console.log('✅ Delivery zones upserted successfully');
    } catch (error) {
      console.error('❌ Error upserting delivery zones:', error);
      // Fallback to the old save method
      await this.saveSettings();
    }

    // Clear localStorage to prevent conflicts
    localStorage.removeItem('deliveryZones');
    localStorage.removeItem('shippingZoneSettings');
    console.log('✅ Delivery zones update and save completed');
  }

  // Force reload from database (useful after admin changes)
  public async reloadFromDatabase(): Promise<void> {
    console.log('🔄 Force reloading shipping zones from database...');
    this.isInitialized = false;
    this.initializationPromise = this.loadSettings();
    await this.initializationPromise;
  }

  // Get current settings
  public async getSettings(): Promise<ShippingZoneSettings> {
    await this.ensureInitialized();
    return { ...this.settings };
  }

  // Get delivery zones
  public async getDeliveryZones(): Promise<DeliveryZone[]> {
    await this.ensureInitialized();
    return [...this.deliveryZones];
  }

  // Set restaurant location
  public async setRestaurantLocation(address: string) {
    const geocodeResult = await this.geocodeAddress(address);
    if (geocodeResult) {
      // Keep the original address format, only update coordinates
      this.settings.restaurantAddress = address; // Preserve the original address
      this.settings.restaurantLat = geocodeResult.lat;
      this.settings.restaurantLng = geocodeResult.lng;
      this.saveSettings();
      return true;
    }
    return false;
  }

  // Initialize default delivery zones
  public async initializeDefaultZones(): Promise<void> {
    this.deliveryZones = [
      {
        id: '1',
        name: 'Zone 1 (0-5km)',
        maxDistance: 5,
        deliveryFee: 3.00,
        estimatedTime: '20-30 minutes',
        isActive: true
      },
      {
        id: '2',
        name: 'Zone 2 (5-10km)',
        maxDistance: 10,
        deliveryFee: 5.00,
        estimatedTime: '30-45 minutes',
        isActive: true
      },
      {
        id: '3',
        name: 'Zone 3 (10-15km)',
        maxDistance: 15,
        deliveryFee: 8.00,
        estimatedTime: '45-60 minutes',
        isActive: true
      }
    ];
    await this.updateDeliveryZones(this.deliveryZones);
    console.log('✅ Default zones initialized and saved');
  }

  // Test method to verify database operations
  public async testDatabaseOperations(): Promise<boolean> {
    try {
      console.log('🧪 Testing database operations...');

      // Test saving zones
      const testZones = [{
        id: 'test-' + Date.now(),
        name: 'Test Zone',
        maxDistance: 5,
        deliveryFee: 3.00,
        estimatedTime: '30 minutes',
        isActive: true
      }];

      await this.updateDeliveryZones(testZones);
      console.log('✅ Test zones saved');

      // Test loading zones
      await this.reloadFromDatabase();
      const loadedZones = await this.getDeliveryZones();
      console.log('✅ Test zones loaded:', loadedZones.length);

      return loadedZones.length > 0;
    } catch (error) {
      console.error('❌ Database test failed:', error);
      return false;
    }
  }

  // Alias method for backward compatibility
  public async validateAddress(address: string, orderAmount: number = 0): Promise<AddressValidationResult> {
    return this.validateDeliveryAddress(address, orderAmount);
  }
}

// Export singleton instance
export const shippingZoneService = new ShippingZoneService();
export default shippingZoneService;

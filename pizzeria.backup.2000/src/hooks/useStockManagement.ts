import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StockManagementSettings {
  enabled: boolean;
  defaultQuantity: number;
}

export const useStockManagement = () => {
  const [settings, setSettings] = useState<StockManagementSettings>({
    enabled: false,
    defaultQuantity: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    console.log('📦 [STOCK] Starting loadSettings...');
    const startTime = Date.now();

    try {
      console.log('📦 [STOCK] Setting isLoading to true');
      setIsLoading(true);

      // Add timeout to prevent hanging
      console.log('📦 [STOCK] Creating 8s timeout promise...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Stock settings loading timeout')), 8000)
      );

      console.log('📦 [STOCK] Creating settings query promise...');
      const settingsPromise = supabase
        .from('settings')
        .select('key, value')
        .in('key', ['stock_management_enabled', 'default_stock_quantity']);

      console.log('📦 [STOCK] Executing Promise.race with timeout...');
      const { data: settingsData, error } = await Promise.race([settingsPromise, timeoutPromise]) as any;

      const queryTime = Date.now() - startTime;
      console.log(`📦 [STOCK] Query completed in ${queryTime}ms`);
      console.log('📦 [STOCK] Query result:', {
        settingsCount: settingsData?.length || 0,
        hasError: !!error,
        errorMessage: error?.message
      });

      if (error) {
        console.error('📦 [STOCK] Error loading stock management settings:', error);
        console.log('📦 [STOCK] Using default settings due to error');
        // Use defaults on error
        setSettings({
          enabled: false,
          defaultQuantity: 100
        });
        return;
      }

      const newSettings = { ...settings };

      settingsData.forEach(setting => {
        if (setting.key === 'stock_management_enabled') {
          // Handle both old double-encoded and new single-encoded values
          let enabled = false;
          try {
            const parsed = JSON.parse(setting.value);
            enabled = parsed === true || parsed === 'true';
          } catch {
            enabled = setting.value === 'true';
          }
          newSettings.enabled = enabled;
        } else if (setting.key === 'default_stock_quantity') {
          let quantity = 100;
          try {
            const parsed = JSON.parse(setting.value);
            quantity = parseInt(typeof parsed === 'string' ? parsed : parsed.toString());
          } catch {
            quantity = parseInt(setting.value) || 100;
          }
          newSettings.defaultQuantity = quantity;
        }
      });

      console.log('📦 [STOCK] Processed settings:', newSettings);
      setSettings(newSettings);

    } catch (error) {
      console.error('📦 [STOCK] Exception in loadSettings:', error);
      console.log('📦 [STOCK] Using default settings due to exception');
      setSettings({
        enabled: false,
        defaultQuantity: 100
      });
    } finally {
      const totalTime = Date.now() - startTime;
      console.log(`📦 [STOCK] loadSettings completed in ${totalTime}ms, setting isLoading to false`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateStockManagementEnabled = async (enabled: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'stock_management_enabled',
          value: JSON.stringify(enabled)
        });

      if (error) {
        console.error('Error updating stock management enabled:', error);
        return false;
      }

      setSettings(prev => ({ ...prev, enabled }));
      console.log('✅ Stock management enabled updated:', enabled);
      return true;

    } catch (error) {
      console.error('Error updating stock management enabled:', error);
      return false;
    }
  };

  const updateDefaultStockQuantity = async (quantity: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'default_stock_quantity',
          value: JSON.stringify(quantity)
        });

      if (error) {
        console.error('Error updating default stock quantity:', error);
        return false;
      }

      setSettings(prev => ({ ...prev, defaultQuantity: quantity }));
      console.log('✅ Default stock quantity updated:', quantity);
      return true;

    } catch (error) {
      console.error('Error updating default stock quantity:', error);
      return false;
    }
  };

  const isProductAvailable = (stockQuantity: number | null | undefined): boolean => {
    if (!settings.enabled) {
      // If stock management is disabled, all products are available
      return true;
    }
    
    // If stock management is enabled, check stock quantity
    return stockQuantity !== null && stockQuantity !== undefined && stockQuantity > 0;
  };

  const getStockStatus = (stockQuantity: number | null | undefined): 'available' | 'low' | 'out_of_stock' | 'unlimited' => {
    if (!settings.enabled) {
      return 'unlimited';
    }

    if (stockQuantity === null || stockQuantity === undefined || stockQuantity <= 0) {
      return 'out_of_stock';
    }

    if (stockQuantity <= 5) {
      return 'low';
    }

    return 'available';
  };

  const getStockMessage = (stockQuantity: number | null | undefined): string => {
    const status = getStockStatus(stockQuantity);
    
    switch (status) {
      case 'unlimited':
        return 'Disponibile';
      case 'available':
        return 'Disponibile';
      case 'low':
        return `Ultimi ${stockQuantity} disponibili`;
      case 'out_of_stock':
        return 'Non disponibile';
      default:
        return 'Disponibile';
    }
  };

  return {
    settings,
    isLoading,
    loadSettings,
    updateStockManagementEnabled,
    updateDefaultStockQuantity,
    isProductAvailable,
    getStockStatus,
    getStockMessage,
    // Convenience getters
    isStockManagementEnabled: settings.enabled,
    defaultStockQuantity: settings.defaultQuantity
  };
};

export default useStockManagement;

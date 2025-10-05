import { useState, useEffect } from 'react';
import { SatisPayQRSettings } from '@/types/satispay';
import { SatisPayService } from '@/services/satispayService';

export const useSatisPaySettings = () => {
  const [settings, setSettings] = useState<SatisPayQRSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await SatisPayService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading SatisPay settings:', err);
      setError('Failed to load SatisPay settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: any) => {
    try {
      setError(null);
      const success = await SatisPayService.updateSettings(newSettings);
      if (success) {
        await loadSettings(); // Reload settings after update
        return true;
      } else {
        setError('Failed to update SatisPay settings');
        return false;
      }
    } catch (err) {
      console.error('Error updating SatisPay settings:', err);
      setError('Failed to update SatisPay settings');
      return false;
    }
  };

  const uploadQRImage = async (file: File) => {
    try {
      setError(null);
      const imageUrl = await SatisPayService.uploadQRImage(file);
      if (imageUrl) {
        return imageUrl;
      } else {
        setError('Failed to upload QR image');
        return null;
      }
    } catch (err) {
      console.error('Error uploading QR image:', err);
      setError('Failed to upload QR image');
      return null;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    loadSettings,
    updateSettings,
    uploadQRImage
  };
};

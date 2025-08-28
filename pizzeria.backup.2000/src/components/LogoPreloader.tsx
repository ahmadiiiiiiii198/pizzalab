import { useEffect, useState } from 'react';

/**
 * LogoPreloader component that preloads the logo image to prevent flashing
 * This component doesn't render anything visible but ensures the logo is cached
 */
const LogoPreloader = () => {
  const [logoSettings, setLogoSettings] = useState({
    logoUrl: "/pizzeria-regina-logo.png",
    altText: "Pizzeria Regina 2000 Torino Logo"
  });

  useEffect(() => {
    // Load logo settings from localStorage
    try {
      const savedLogoSettings = localStorage.getItem('logoSettings');
      if (savedLogoSettings) {
        const parsed = JSON.parse(savedLogoSettings);
        setLogoSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Error loading logo settings from localStorage:', error);
    }

    // Listen for logo settings updates
    const handleLogoSettingsUpdate = (event: CustomEvent) => {
      setLogoSettings(prev => ({ ...prev, ...event.detail }));
    };

    window.addEventListener('logoSettingsUpdated', handleLogoSettingsUpdate as EventListener);

    return () => {
      window.removeEventListener('logoSettingsUpdated', handleLogoSettingsUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (logoSettings.logoUrl) {
      // Create a new image element to preload the logo
      const img = new Image();

      // Set up event handlers
      img.onload = () => {
        console.log('Logo preloaded successfully');
      };

      img.onerror = () => {
        console.warn('Failed to preload logo:', logoSettings.logoUrl);
      };

      // Start preloading
      img.src = logoSettings.logoUrl;
    }
  }, [logoSettings.logoUrl]);

  // This component doesn't render anything
  return null;
};

export default LogoPreloader;

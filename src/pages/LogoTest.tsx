import React, { useState, useEffect } from 'react';
import { useLogoSettings } from '@/hooks/use-settings';
import { settingsService } from '@/services/settingsService';

const LogoTest = () => {
  const [logoSettings, updateLogoSettings, isLoading] = useLogoSettings();
  const [directFetch, setDirectFetch] = useState<any>(null);
  const [imageLoadState, setImageLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLog(prev => [...prev, logMessage]);
    console.log(`🧪 [LogoTest] ${logMessage}`);
  };

  useEffect(() => {
    addLog('LogoTest component mounted');
    
    // Test direct fetch
    const testDirectFetch = async () => {
      try {
        addLog('Testing direct fetch from settingsService...');
        await settingsService.initialize();
        const result = await settingsService.getSetting('logoSettings', {
          logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
          altText: "Pizzeria Regina 2000 Torino Logo"
        });
        setDirectFetch(result);
        addLog(`Direct fetch result: ${JSON.stringify(result)}`);
      } catch (error) {
        addLog(`Direct fetch error: ${error}`);
      }
    };

    testDirectFetch();
  }, []);

  useEffect(() => {
    addLog(`Hook state changed - isLoading: ${isLoading}, logoSettings: ${JSON.stringify(logoSettings)}`);
  }, [logoSettings, isLoading]);

  const testImageLoad = () => {
    if (!logoSettings?.logoUrl) {
      addLog('No logo URL to test');
      return;
    }

    addLog(`Testing image load for: ${logoSettings.logoUrl}`);
    setImageLoadState('loading');

    const img = new Image();
    img.onload = () => {
      addLog(`✅ Image loaded successfully: ${logoSettings.logoUrl}`);
      addLog(`Image dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
      setImageLoadState('loaded');
    };
    img.onerror = () => {
      addLog(`❌ Image failed to load: ${logoSettings.logoUrl}`);
      setImageLoadState('error');
    };
    img.src = logoSettings.logoUrl;
  };

  const refreshSettings = async () => {
    addLog('Manually refreshing settings...');
    try {
      const fresh = await settingsService.getSetting('logoSettings', {
        logoUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png",
        altText: "Pizzeria Regina 2000 Torino Logo"
      });
      addLog(`Fresh settings fetched: ${JSON.stringify(fresh)}`);
      
      const success = await updateLogoSettings(fresh);
      addLog(`Hook update result: ${success}`);
    } catch (error) {
      addLog(`Refresh error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🍕 Logo Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hook State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Hook State</h2>
            <div className="space-y-2">
              <div><strong>Loading:</strong> {isLoading ? 'YES' : 'NO'}</div>
              <div><strong>Logo URL:</strong> {logoSettings?.logoUrl || 'NONE'}</div>
              <div><strong>Alt Text:</strong> {logoSettings?.altText || 'NONE'}</div>
            </div>
          </div>

          {/* Direct Fetch */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Direct Fetch</h2>
            <div className="space-y-2">
              <div><strong>URL:</strong> {directFetch?.logoUrl || 'NONE'}</div>
              <div><strong>Alt:</strong> {directFetch?.altText || 'NONE'}</div>
            </div>
          </div>

          {/* Image Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Image Test</h2>
            <div className="space-y-4">
              <button 
                onClick={testImageLoad}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!logoSettings?.logoUrl}
              >
                Test Image Load
              </button>
              
              <div>
                <strong>Status:</strong> {imageLoadState}
              </div>

              {logoSettings?.logoUrl && (
                <div className="border-2 border-dashed border-gray-300 p-4 text-center">
                  <img
                    src={logoSettings.logoUrl}
                    alt={logoSettings.altText || 'Logo'}
                    className="max-w-full h-32 mx-auto object-contain"
                    onLoad={() => addLog('React img onLoad fired')}
                    onError={() => addLog('React img onError fired')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            <div className="space-y-2">
              <button 
                onClick={refreshSettings}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
              >
                Refresh Settings
              </button>
            </div>
          </div>
        </div>

        {/* Debug Log */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto font-mono text-sm">
            {debugLog.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoTest;

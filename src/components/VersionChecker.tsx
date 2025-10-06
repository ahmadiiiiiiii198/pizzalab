import React, { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VersionInfo {
  version: string;
  buildDate: string;
  timestamp: number;
}

const VersionChecker: React.FC = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [newVersion, setNewVersion] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check for new version every 5 minutes
    const checkVersion = async () => {
      try {
        console.log('🔍 [VersionChecker] Checking for new version...');
        
        // Get current version from localStorage
        const currentVersion = localStorage.getItem('app_version');
        console.log('📦 [VersionChecker] Current version:', currentVersion);
        
        // Fetch version.json from server with cache-busting
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) {
          console.warn('⚠️ [VersionChecker] Failed to fetch version.json');
          return;
        }
        
        const versionInfo: VersionInfo = await response.json();
        console.log('🆕 [VersionChecker] Server version:', versionInfo.version);
        
        // Compare versions
        if (currentVersion && currentVersion !== versionInfo.version) {
          console.log('🎉 [VersionChecker] New version available!');
          setNewVersion(versionInfo.version);
          setShowUpdateNotification(true);
        } else {
          console.log('✅ [VersionChecker] Version is up to date');
        }
      } catch (error) {
        console.error('❌ [VersionChecker] Error checking version:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Check every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    console.log('🔄 [VersionChecker] Starting update process...');

    try {
      // 1. Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('🗑️ [VersionChecker] Clearing caches:', cacheNames);
        
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ [VersionChecker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        console.log('✅ [VersionChecker] All caches cleared');
      }

      // 2. Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔄 [VersionChecker] Unregistering service workers:', registrations.length);
        
        await Promise.all(
          registrations.map(registration => {
            console.log('🔄 [VersionChecker] Unregistering:', registration.scope);
            return registration.unregister();
          })
        );
        
        console.log('✅ [VersionChecker] All service workers unregistered');
      }

      // 3. Update version in localStorage
      localStorage.setItem('app_version', newVersion);
      localStorage.setItem('last_cache_clear', new Date().toISOString());
      console.log('💾 [VersionChecker] Updated localStorage with new version:', newVersion);

      // 4. Clear session storage
      sessionStorage.clear();
      console.log('🗑️ [VersionChecker] Session storage cleared');

      // 5. Reload the page with hard refresh
      console.log('🔄 [VersionChecker] Reloading page...');
      window.location.reload();
    } catch (error) {
      console.error('❌ [VersionChecker] Error during update:', error);
      setIsUpdating(false);
      
      // Fallback: just reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    console.log('❌ [VersionChecker] Update dismissed by user');
    setShowUpdateNotification(false);
    
    // Show again in 30 minutes
    setTimeout(() => {
      setShowUpdateNotification(true);
    }, 30 * 60 * 1000);
  };

  if (!showUpdateNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slide-in-up">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-2xl p-4 max-w-sm border-2 border-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <h3 className="font-bold text-lg">Nuovo Aggiornamento!</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Chiudi notifica"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm mb-4 text-white/90">
          È disponibile una nuova versione dell'app con miglioramenti e correzioni.
        </p>
        
        <div className="flex space-x-2">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-white text-orange-600 hover:bg-gray-100 font-semibold"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Aggiornamento...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aggiorna ora
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            Dopo
          </Button>
        </div>
        
        <p className="text-xs mt-3 text-white/70">
          Versione: {newVersion}
        </p>
      </div>
    </div>
  );
};

export default VersionChecker;


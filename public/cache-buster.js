// Cache Buster Script - Auto-generated
// Version: 2025.10.7.1759840224827
// Generated: 2025-10-07T12:30:24.839Z

const APP_VERSION = '2025.10.7.1759840224827';

(function() {
  'use strict';
  
  console.log('🔄 [Cache-Buster] Initializing... Version:', APP_VERSION);
  
  // Detect mobile browsers
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  console.log('📱 [Cache-Buster] Device:', { isMobile, isIOS, isAndroid });
  
  // Check stored version
  const storedVersion = localStorage.getItem('app_version');
  console.log('💾 [Cache-Buster] Stored version:', storedVersion);
  console.log('🆕 [Cache-Buster] Current version:', APP_VERSION);
  
  // Version changed - clear caches and reload
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('🔄 [Cache-Buster] Version changed! Clearing caches...');
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('🗑️ [Cache-Buster] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        console.log('✅ [Cache-Buster] All caches cleared');
        
        // Update version
        localStorage.setItem('app_version', APP_VERSION);
        localStorage.setItem('last_cache_clear', new Date().toISOString());
        
        // Prevent infinite reload loop
        const reloadCount = parseInt(sessionStorage.getItem('reload_count') || '0');
        if (reloadCount < 2) {
          sessionStorage.setItem('reload_count', (reloadCount + 1).toString());
          console.log('🔄 [Cache-Buster] Reloading page... (attempt ' + (reloadCount + 1) + ')');
          window.location.reload(true);
        } else {
          console.log('⚠️ [Cache-Buster] Max reload attempts reached');
          sessionStorage.removeItem('reload_count');
        }
      });
    } else {
      // No cache API, just update version and reload
      localStorage.setItem('app_version', APP_VERSION);
      window.location.reload(true);
    }
  } else if (!storedVersion) {
    // First visit - store version
    console.log('🆕 [Cache-Buster] First visit - storing version');
    localStorage.setItem('app_version', APP_VERSION);
    sessionStorage.removeItem('reload_count');
  } else {
    // Same version - reset reload count
    sessionStorage.removeItem('reload_count');
    console.log('✅ [Cache-Buster] Version up to date');
  }
  
  // Add cache-busting parameter to all fetch requests
  if (isMobile) {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && !url.includes('?v=')) {
        const separator = url.includes('?') ? '&' : '?';
        args[0] = url + separator + 'v=' + APP_VERSION;
      }
      return originalFetch.apply(this, args);
    };
    console.log('🔧 [Cache-Buster] Fetch interceptor installed');
  }
  
  // Handle visibility changes (app switching on mobile)
  if (isMobile) {
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        console.log('👁️ [Cache-Buster] App visible - checking version...');
        const currentStored = localStorage.getItem('app_version');
        if (currentStored !== APP_VERSION) {
          console.log('🔄 [Cache-Buster] Version mismatch detected on visibility change');
          localStorage.setItem('app_version', APP_VERSION);
          window.location.reload(true);
        }
      }
    });
  }
  
  console.log('✅ [Cache-Buster] Initialization complete');
})();

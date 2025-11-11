// Supabase URL Fixer - Runs BEFORE cache-buster
// This script intercepts ALL fetch requests and cleans Supabase URLs
// It runs immediately when the page loads, before any other scripts

(function() {
  'use strict';
  
  console.log('🔧 [URL-Fixer] Initializing Supabase URL cleaner...');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch globally
  window.fetch = function(url, options = {}) {
    let cleanUrl = url;
    
    // Clean Supabase URLs by removing version parameters
    if (typeof url === 'string' && url.includes('supabase.co')) {
      const originalUrl = url;
      // Remove any version parameters that break PostgREST query parsing
      cleanUrl = url.replace(/[?&]v=[^&]+/g, '');
      
      if (cleanUrl !== originalUrl) {
        console.log(`🔧 [URL-Fixer] Cleaned: ${originalUrl} → ${cleanUrl}`);
      }
    }
    
    // Call the original fetch with the cleaned URL
    return originalFetch.call(this, cleanUrl, options);
  };
  
  console.log('✅ [URL-Fixer] Global fetch interceptor installed');
})();

const fs = require('fs');
const path = require('path');

// Generate version based on timestamp: YYYY.M.D.timestamp
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1; // 0-indexed
const day = now.getDate();
const timestamp = Date.now();
const version = `${year}.${month}.${day}.${timestamp}`;

console.log('\n🚀 Updating version to:', version);
console.log('━'.repeat(60));

// 1. Update index.html - Change service worker registration URL
const indexPath = path.join(__dirname, '..', 'index.html');
try {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Replace service worker registration with versioned URL
  indexContent = indexContent.replace(
    /navigator\.serviceWorker\.register\('\/sw\.js(\?v=[^']*)?'\)/g,
    `navigator.serviceWorker.register('/sw.js?v=${version}')`
  );
  
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('✅ Updated index.html with version:', version);
  
  // Find and log the line number
  const lines = indexContent.split('\n');
  const lineIndex = lines.findIndex(line => line.includes(`/sw.js?v=${version}`));
  if (lineIndex !== -1) {
    console.log(`   Line ${lineIndex + 1}: /sw.js?v=${version}`);
  }
} catch (error) {
  console.error('❌ Error updating index.html:', error.message);
}

// 2. Update public/sw.js - Add APP_VERSION constant
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
try {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check if APP_VERSION already exists
  if (swContent.includes('const APP_VERSION')) {
    // Replace existing version
    swContent = swContent.replace(
      /const APP_VERSION = '[^']*';/,
      `const APP_VERSION = '${version}';`
    );
  } else {
    // Add APP_VERSION at the top after the comment
    const lines = swContent.split('\n');
    lines.splice(3, 0, `const APP_VERSION = '${version}';`);
    swContent = lines.join('\n');
  }
  
  // Update CACHE_NAME to include version
  swContent = swContent.replace(
    /const CACHE_NAME = 'pizzalab-v[^']*';/,
    `const CACHE_NAME = 'pizzalab-v${version}';`
  );
  
  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log('✅ Updated public/sw.js with APP_VERSION:', version);
  
  // Find and log the line number
  const lines = swContent.split('\n');
  const lineIndex = lines.findIndex(line => line.includes(`APP_VERSION = '${version}'`));
  if (lineIndex !== -1) {
    console.log(`   Line ${lineIndex + 1}: APP_VERSION = '${version}'`);
  }
} catch (error) {
  console.error('❌ Error updating public/sw.js:', error.message);
}

// 3. Create/Update public/cache-buster.js
const cacheBusterPath = path.join(__dirname, '..', 'public', 'cache-buster.js');
const cacheBusterContent = `// Cache Buster Script - Auto-generated
// Version: ${version}
// Generated: ${new Date().toISOString()}

const APP_VERSION = '${version}';

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
`;

try {
  fs.writeFileSync(cacheBusterPath, cacheBusterContent, 'utf8');
  console.log('✅ Created/Updated public/cache-buster.js');
  console.log(`   APP_VERSION = '${version}'`);
} catch (error) {
  console.error('❌ Error creating cache-buster.js:', error.message);
}

// 4. Create public/version.json
const versionJsonPath = path.join(__dirname, '..', 'public', 'version.json');
const versionData = {
  version: version,
  buildDate: new Date().toISOString(),
  timestamp: timestamp,
  year: year,
  month: month,
  day: day
};

try {
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf8');
  console.log('✅ Created public/version.json');
  console.log('   Version:', version);
  console.log('   Build Date:', versionData.buildDate);
} catch (error) {
  console.error('❌ Error creating version.json:', error.message);
}

console.log('━'.repeat(60));
console.log('✅ Version update complete!\n');


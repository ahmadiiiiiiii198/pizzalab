// Utility to clear all localStorage and cookie-based order tracking data
// This ensures a clean transition to database-only order tracking

export const clearAllLocalStorageOrders = (): boolean => {
  try {
    console.log('🧹 Clearing all localStorage order tracking data...');
    
    // Clear all pizzeria-related localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('pizzeria_') ||
        key.includes('order') ||
        key.includes('tracking') ||
        key === 'pizzeria_order_tracking' ||
        key === 'pizzeria_last_order' ||
        key === 'pizzeria_active_order'
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🗑️ Removed localStorage key:', key);
    });
    
    console.log(`✅ Cleared ${keysToRemove.length} localStorage keys`);
    return true;
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
    return false;
  }
};

export const clearAllOrderCookies = (): boolean => {
  try {
    console.log('🧹 Clearing all order tracking cookies...');
    
    // Get all cookies
    const cookies = document.cookie.split(';');
    let clearedCount = 0;
    
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name && (
        name.startsWith('pizzeria_') ||
        name.includes('order') ||
        name.includes('client')
      )) {
        // Delete the cookie by setting it to expire in the past
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log('🗑️ Removed cookie:', name);
        clearedCount++;
      }
    }
    
    console.log(`✅ Cleared ${clearedCount} cookies`);
    return true;
  } catch (error) {
    console.error('❌ Error clearing cookies:', error);
    return false;
  }
};

export const clearAllOrderTrackingData = (): boolean => {
  console.log('🧹 Starting complete order tracking data cleanup...');
  
  const localStorageCleared = clearAllLocalStorageOrders();
  const cookiesCleared = clearAllOrderCookies();
  
  if (localStorageCleared && cookiesCleared) {
    console.log('✅ All order tracking data cleared successfully');
    console.log('🔄 Order tracking now uses database-only approach');
    return true;
  } else {
    console.warn('⚠️ Some data may not have been cleared properly');
    return false;
  }
};

// Auto-clear on import (run once when the app starts)
export const initializeDatabaseOnlyTracking = (): void => {
  // Only clear if there's actually data to clear
  const hasLocalStorageData = localStorage.getItem('pizzeria_order_tracking') || 
                              localStorage.getItem('pizzeria_last_order') ||
                              localStorage.getItem('pizzeria_active_order');
  
  const hasCookieData = document.cookie.includes('pizzeria_order_') ||
                        document.cookie.includes('pizzeria_client_');
  
  if (hasLocalStorageData || hasCookieData) {
    console.log('🔄 Migrating from localStorage/cookie tracking to database-only tracking...');
    clearAllOrderTrackingData();
    
    // Show a one-time notification about the migration
    if (typeof window !== 'undefined' && window.localStorage) {
      const migrationKey = 'pizzeria_migration_to_database_complete';
      if (!localStorage.getItem(migrationKey)) {
        localStorage.setItem(migrationKey, 'true');
        console.log('✅ Migration to database-only order tracking complete');
      }
    }
  }
};

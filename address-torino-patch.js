/**
 * Address Validation Patch for Torino, Italy
 * 
 * This script ensures all customer addresses are automatically
 * appended with ", Torino, Italy" before geocoding validation.
 * 
 * Load this script BEFORE the main application bundle.
 */

(function() {
    'use strict';
    
    console.log('🇮🇹 Torino Address Patch: Initializing...');
    
    // Default city configuration
    const DEFAULT_CITY = 'Torino';
    const DEFAULT_COUNTRY = 'Italy';
    const FULL_LOCATION = `${DEFAULT_CITY}, ${DEFAULT_COUNTRY}`;
    
    /**
     * Normalizes an address to include Torino, Italy
     * @param {string} address - The user-entered address
     * @returns {string} - The normalized address with city and country
     */
    window.normalizeAddressForTorino = function(address) {
        if (!address || typeof address !== 'string') {
            return address;
        }
        
        const trimmedAddress = address.trim();
        
        // Check if address already contains Torino or Italy
        const lowerAddress = trimmedAddress.toLowerCase();
        const hasTorino = lowerAddress.includes('torino') || lowerAddress.includes('turin');
        const hasItaly = lowerAddress.includes('italy') || lowerAddress.includes('italia');
        
        // If address already has both city and country, return as is
        if (hasTorino && hasItaly) {
            console.log('✅ Address already contains Torino, Italy:', trimmedAddress);
            return trimmedAddress;
        }
        
        // If address has Torino but not Italy
        if (hasTorino && !hasItaly) {
            const normalized = `${trimmedAddress}, ${DEFAULT_COUNTRY}`;
            console.log('📍 Added country to address:', normalized);
            return normalized;
        }
        
        // If address has Italy but not Torino
        if (!hasTorino && hasItaly) {
            // Insert Torino before Italy
            const normalized = trimmedAddress.replace(/,?\s*(italy|italia)/i, `, ${DEFAULT_CITY}, $1`);
            console.log('📍 Added city to address:', normalized);
            return normalized;
        }
        
        // Address has neither - append full location
        const normalized = `${trimmedAddress}, ${FULL_LOCATION}`;
        console.log('📍 Normalized address:', normalized);
        return normalized;
    };
    
    /**
     * Intercept Google Maps Geocoding requests
     */
    if (typeof google !== 'undefined' && google.maps) {
        patchGoogleMapsGeocoder();
    } else {
        // Wait for Google Maps to load
        const checkGoogleMaps = setInterval(() => {
            if (typeof google !== 'undefined' && google.maps) {
                clearInterval(checkGoogleMaps);
                patchGoogleMapsGeocoder();
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkGoogleMaps), 10000);
    }
    
    function patchGoogleMapsGeocoder() {
        console.log('🗺️ Patching Google Maps Geocoder for Torino...');
        
        // Patch Geocoder
        if (google.maps.Geocoder) {
            const originalGeocode = google.maps.Geocoder.prototype.geocode;
            
            google.maps.Geocoder.prototype.geocode = function(request, callback) {
                if (request.address) {
                    const originalAddress = request.address;
                    request.address = window.normalizeAddressForTorino(originalAddress);
                    console.log('🔄 Geocoding request intercepted:');
                    console.log('   Original:', originalAddress);
                    console.log('   Modified:', request.address);
                }
                
                return originalGeocode.call(this, request, callback);
            };
            
            console.log('✅ Geocoder patched successfully');
        }
        
        // Patch Distance Matrix Service
        if (google.maps.DistanceMatrixService) {
            const originalGetDistanceMatrix = google.maps.DistanceMatrixService.prototype.getDistanceMatrix;
            
            google.maps.DistanceMatrixService.prototype.getDistanceMatrix = function(request, callback) {
                // Normalize destinations (customer addresses)
                if (request.destinations && Array.isArray(request.destinations)) {
                    request.destinations = request.destinations.map(dest => {
                        if (typeof dest === 'string') {
                            const normalized = window.normalizeAddressForTorino(dest);
                            console.log('🔄 Distance Matrix destination normalized:');
                            console.log('   Original:', dest);
                            console.log('   Modified:', normalized);
                            return normalized;
                        }
                        return dest;
                    });
                }
                
                return originalGetDistanceMatrix.call(this, request, callback);
            };
            
            console.log('✅ Distance Matrix Service patched successfully');
        }
    }
    
    /**
     * Intercept fetch requests to Google Maps API
     */
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && url.includes('maps.googleapis.com')) {
            // Check if it's a geocoding or distance matrix request
            if (url.includes('/geocode/') || url.includes('/distancematrix/')) {
                try {
                    const urlObj = new URL(url);
                    
                    // Normalize 'address' parameter
                    if (urlObj.searchParams.has('address')) {
                        const originalAddress = urlObj.searchParams.get('address');
                        const normalizedAddress = window.normalizeAddressForTorino(originalAddress);
                        urlObj.searchParams.set('address', normalizedAddress);
                        url = urlObj.toString();
                        
                        console.log('🔄 Fetch request intercepted (geocode):');
                        console.log('   Original:', originalAddress);
                        console.log('   Modified:', normalizedAddress);
                    }
                    
                    // Normalize 'destinations' parameter
                    if (urlObj.searchParams.has('destinations')) {
                        const originalDest = urlObj.searchParams.get('destinations');
                        const normalizedDest = window.normalizeAddressForTorino(originalDest);
                        urlObj.searchParams.set('destinations', normalizedDest);
                        url = urlObj.toString();
                        
                        console.log('🔄 Fetch request intercepted (distance):');
                        console.log('   Original:', originalDest);
                        console.log('   Modified:', normalizedDest);
                    }
                } catch (e) {
                    console.warn('⚠️ Error parsing Google Maps URL:', e);
                }
            }
        }
        
        return originalFetch.call(this, url, options);
    };
    
    /**
     * Add input field helper for address fields
     */
    function addAddressFieldHelper() {
        // Find address input fields
        const addressInputs = document.querySelectorAll('input[name*="address"], input[id*="address"], input[placeholder*="indirizzo"]');
        
        addressInputs.forEach(input => {
            if (input.dataset.torinoPatched) return;
            input.dataset.torinoPatched = 'true';
            
            // Add placeholder hint
            const originalPlaceholder = input.placeholder || '';
            if (!originalPlaceholder.toLowerCase().includes('torino')) {
                input.placeholder = originalPlaceholder 
                    ? `${originalPlaceholder} (Torino)` 
                    : 'Via, numero civico (Torino)';
            }
            
            // Add helper text below input
            const helper = document.createElement('div');
            helper.style.cssText = 'font-size: 12px; color: #64748b; margin-top: 4px;';
            helper.innerHTML = '📍 Gli indirizzi sono automaticamente localizzati a Torino, Italia';
            
            if (input.parentNode && !input.parentNode.querySelector('.torino-helper')) {
                helper.className = 'torino-helper';
                input.parentNode.appendChild(helper);
            }
        });
    }
    
    // Run helper on DOM ready and periodically (for dynamic content)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addAddressFieldHelper);
    } else {
        addAddressFieldHelper();
    }
    
    // Re-run helper every 2 seconds to catch dynamically added fields
    setInterval(addAddressFieldHelper, 2000);
    
    console.log('✅ Torino Address Patch: Initialized successfully');
    console.log(`📍 Default location: ${FULL_LOCATION}`);
    
})();

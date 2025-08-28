// Advanced client identification and device fingerprinting for pizzeria order tracking

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  colorDepth: number;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  canvasFingerprint: string;
  webglFingerprint: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  ipAddress: string;
  sessionStorage: boolean;
  localStorage: boolean;
  touchSupport: boolean;
}

interface ClientIdentity {
  clientId: string;
  deviceFingerprint: string;
  sessionId: string;
  createdAt: string;
  lastSeen: string;
}

// Generate canvas fingerprint
const generateCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 'no-canvas';
    
    // Draw unique pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Pizzeria Regina 2000 🍕', 2, 2);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Client ID Generator', 4, 17);
    
    return canvas.toDataURL().slice(-50);
  } catch (error) {
    return 'canvas-error';
  }
};

// Generate WebGL fingerprint
const generateWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return `${vendor}_${renderer}`.slice(-30);
    }
    
    return 'webgl-limited';
  } catch (error) {
    return 'webgl-error';
  }
};

// Get client IP address
const getClientIPAddress = async (): Promise<string> => {
  try {
    console.log('🌐 Starting IP detection...');

    // Try multiple IP detection services for reliability
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ];

    for (const service of ipServices) {
      try {
        console.log(`🔍 Trying IP service: ${service}`);
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          console.log(`⚠️ IP service ${service} returned status: ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`📡 IP service ${service} response:`, data);

        // Different services return IP in different formats
        const ip = data.ip || data.origin || data.query;
        if (ip && typeof ip === 'string') {
          console.log('✅ Client IP detected:', ip.slice(0, 8) + '...');
          // Store IP in localStorage for consistency
          localStorage.setItem('pizzeria_client_ip', ip);
          return ip;
        }
      } catch (e) {
        console.log(`❌ IP service ${service} failed:`, e.message);
        continue;
      }
    }

    // Try to get stored IP first
    const storedIP = localStorage.getItem('pizzeria_client_ip');
    if (storedIP) {
      console.log('🔄 Using stored IP:', storedIP.slice(0, 8) + '...');
      return storedIP;
    }

    // Fallback to a consistent identifier based on browser characteristics
    const browserFingerprint = btoa(`${navigator.userAgent}_${screen.width}x${screen.height}_${navigator.language}_${Intl.DateTimeFormat().resolvedOptions().timeZone}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    const fallbackId = `local_${browserFingerprint}`;
    console.log('🔧 Using fallback IP identifier:', fallbackId.slice(0, 15) + '...');
    localStorage.setItem('pizzeria_client_ip', fallbackId);
    return fallbackId;
  } catch (error) {
    console.error('❌ Failed to get IP address:', error);
    // Use a consistent fallback based on browser characteristics
    const browserFingerprint = btoa(`${navigator.userAgent}_${screen.width}x${screen.height}_${navigator.language}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    const fallbackId = `fallback_${browserFingerprint}`;
    localStorage.setItem('pizzeria_client_ip', fallbackId);
    return fallbackId;
  }
};

// Generate comprehensive device fingerprint
export const generateDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
  const nav = navigator as any;

  // Get IP address
  const ipAddress = await getClientIPAddress();

  // Check touch support
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    canvasFingerprint: generateCanvasFingerprint(),
    webglFingerprint: generateWebGLFingerprint(),
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || 0,
    ipAddress,
    sessionStorage: typeof sessionStorage !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    touchSupport
  };
};

// Create hash from fingerprint
const hashFingerprint = (fingerprint: DeviceFingerprint): string => {
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;

  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

// Generate unique client ID
export const generateClientId = async (): Promise<string> => {
  const fingerprint = await generateDeviceFingerprint();
  const fingerprintHash = hashFingerprint(fingerprint);
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);

  return `pizzeria_${fingerprintHash}_${timestamp}_${random}`;
};

// Generate session ID
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

// Get or create client identity
export const getOrCreateClientIdentity = async (): Promise<ClientIdentity> => {
  const STORAGE_KEY = 'pizzeria_client_identity';
  const COOKIE_KEY = 'pizzeria_client_id';

  try {
    // Try to get from localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const identity = JSON.parse(stored);
        console.log('🔄 Found existing client identity:', identity.clientId.slice(-12));
        // Update last seen
        identity.lastSeen = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
        setCookie(COOKIE_KEY, identity.clientId, 30);
        console.log('✅ Using existing client identity:', identity.clientId.slice(-12));
        return identity;
      } catch (e) {
        console.log('⚠️ Corrupted stored identity, creating new one');
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Try to get from cookie and regenerate identity
    const cookieClientId = getCookie(COOKIE_KEY);
    if (cookieClientId) {
      console.log('🍪 Found cookie client ID, regenerating identity...');
      const fingerprint = await generateDeviceFingerprint();
      const identity: ClientIdentity = {
        clientId: cookieClientId,
        deviceFingerprint: hashFingerprint(fingerprint),
        sessionId: generateSessionId(),
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      return identity;
    }

    // Create new identity with IP-based fingerprinting
    console.log('🆕 Creating new client identity with IP detection...');
    const fingerprint = await generateDeviceFingerprint();
    const clientId = await generateClientId();

    const newIdentity: ClientIdentity = {
      clientId,
      deviceFingerprint: hashFingerprint(fingerprint),
      sessionId: generateSessionId(),
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity));
    setCookie(COOKIE_KEY, newIdentity.clientId, 30);

    console.log('🆔 Created new client identity:', newIdentity.clientId.slice(-12));
    console.log('🌐 IP-based fingerprint:', fingerprint.ipAddress.slice(0, 8) + '...');
    return newIdentity;

  } catch (error) {
    console.error('Error managing client identity:', error);
    // Fallback identity
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      clientId: fallbackId,
      deviceFingerprint: 'error',
      sessionId: generateSessionId(),
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
  }
};

// Clear client identity
export const clearClientIdentity = () => {
  localStorage.removeItem('pizzeria_client_identity');
  localStorage.removeItem('pizzeria_client_ip');
  document.cookie = 'pizzeria_client_id=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  console.log('🗑️ Client identity and IP cleared');
};

// Force regenerate client identity (for testing)
export const regenerateClientIdentity = async (): Promise<ClientIdentity> => {
  clearClientIdentity();
  return await getOrCreateClientIdentity();
};

// Check if two fingerprints are similar (for device recognition)
export const areFingerprintsSimilar = (fp1: string, fp2: string): boolean => {
  if (fp1 === fp2) return true;
  
  // Allow for minor variations (e.g., browser updates)
  const similarity = fp1.length > 0 && fp2.length > 0 ? 
    (fp1.split('').filter((char, i) => char === fp2[i]).length / Math.max(fp1.length, fp2.length)) : 0;
  
  return similarity > 0.8; // 80% similarity threshold
};

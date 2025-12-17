/**
 * Utility for managing Firebase ID tokens in localStorage
 * This helps with iOS Safari issues where Firebase Auth persistence doesn't work reliably
 */

const TOKEN_KEY = 'firebase_id_token';
const TOKEN_EXPIRY_KEY = 'firebase_token_expiry';

/**
 * Save Firebase ID token to localStorage with expiry time
 * @param {string} token - Firebase ID token
 */
export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // Firebase tokens expire after 1 hour, save expiry time
    const expiryTime = Date.now() + (55 * 60 * 1000); // 55 minutes to be safe
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    console.log('✅ Token guardado en localStorage');
  } catch (error) {
    console.error('❌ Error guardando token en localStorage:', error);
  }
}

/**
 * Get Firebase ID token from localStorage
 * @returns {string|null} Token if valid, null if expired or not found
 */
export function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return null;
    }
    
    // Check if token is expired
    if (Date.now() > parseInt(expiry, 10)) {
      console.log('⏰ Token expirado, removiendo...');
      clearToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error obteniendo token de localStorage:', error);
    return null;
  }
}

/**
 * Check if stored token is expired or about to expire
 * @param {number} bufferMinutes - Minutes before expiry to consider as expired (default 5)
 * @returns {boolean} True if expired or about to expire
 */
export function isTokenExpired(bufferMinutes = 5) {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() > (parseInt(expiry, 10) - bufferMs);
  } catch (error) {
    return true;
  }
}

/**
 * Clear token from localStorage
 */
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log('🧹 Token removido de localStorage');
  } catch (error) {
    console.error('❌ Error limpiando token de localStorage:', error);
  }
}

/**
 * Get time remaining until token expires (in milliseconds)
 * @returns {number} Milliseconds until expiry, or 0 if expired/not found
 */
export function getTimeUntilExpiry() {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return 0;
    
    const remaining = parseInt(expiry, 10) - Date.now();
    return Math.max(0, remaining);
  } catch (error) {
    return 0;
  }
}


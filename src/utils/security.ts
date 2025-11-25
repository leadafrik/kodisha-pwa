/**
 * Security utility functions for the frontend
 */

/**
 * Enforce HTTPS in production
 * Redirects HTTP requests to HTTPS
 */
export const enforceHttps = (): void => {
  if (
    process.env.NODE_ENV === 'production' &&
    window.location.protocol === 'http:' &&
    !window.location.hostname.includes('localhost')
  ) {
    window.location.href = window.location.href.replace('http://', 'https://');
  }
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validate that a string is safe HTML (no scripts)
 */
export const isSafeHtml = (html: string): boolean => {
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const javascriptPattern = /javascript:/gi;
  const eventHandlerPattern = /on\w+\s*=/gi;
  
  return (
    !scriptPattern.test(html) &&
    !javascriptPattern.test(html) &&
    !eventHandlerPattern.test(html)
  );
};

/**
 * Check if localStorage is available and working
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Securely store token with expiration
 */
export const secureStoreToken = (token: string, expiresInDays: number = 7): void => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available');
    return;
  }

  const expiry = new Date().getTime() + expiresInDays * 24 * 60 * 60 * 1000;
  const data = JSON.stringify({ token, expiry });
  
  try {
    localStorage.setItem('kodisha_token', data);
  } catch (e) {
    console.error('Failed to store token', e);
  }
};

/**
 * Retrieve token if not expired
 */
export const getSecureToken = (): string | null => {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const stored = localStorage.getItem('kodisha_token');
    if (!stored) return null;

    const { token, expiry } = JSON.parse(stored);
    
    // Check if token is expired
    if (new Date().getTime() > expiry) {
      localStorage.removeItem('kodisha_token');
      return null;
    }

    return token;
  } catch (e) {
    console.error('Failed to retrieve token', e);
    return null;
  }
};

/**
 * Clear all auth tokens
 */
export const clearAuthTokens = (): void => {
  if (!isLocalStorageAvailable()) return;

  localStorage.removeItem('kodisha_token');
  localStorage.removeItem('kodisha_admin_token');
  localStorage.removeItem('token');
};

/**
 * Validate phone number format (Kenyan format)
 */
export const isValidKenyanPhone = (phone: string): boolean => {
  // Remove spaces and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it matches Kenyan format: +254... or 07... or 01...
  const kenyanPattern = /^(\+254|254|0)([17]\d{8})$/;
  return kenyanPattern.test(cleaned);
};

/**
 * Format Kenyan phone to standard format (+254...)
 */
export const formatKenyanPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+254')) {
    return cleaned;
  } else if (cleaned.startsWith('254')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+254' + cleaned.substring(1);
  }
  
  return phone;
};

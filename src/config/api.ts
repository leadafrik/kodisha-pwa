// Use environment variable for local development, fallback to production
export const API_BASE_URL = process.env.REACT_APP_API_URL 
  || 'https://kodisha-backend-vjr9.onrender.com/api';

export const API_ENDPOINTS = {
  // Authentication (your existing endpoints)
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    me: `${API_BASE_URL}/auth/me`,
    // ✅ ADDED VERIFICATION ENDPOINTS
    verifyPhone: `${API_BASE_URL}/auth/verify-phone`,
    resendVerification: `${API_BASE_URL}/auth/resend-verification`,
    // 🆕 ADMIN REGISTRATION
    registerAdmin: `${API_BASE_URL}/auth/register-admin`,
  },
  // Properties (your existing endpoints)
  properties: {
    getAll: `${API_BASE_URL}/listings`,
    create: `${API_BASE_URL}/listings`,
    getById: (id: string) => `${API_BASE_URL}/listings/${id}`,
  },
  // Services (we'll add these later)
  services: {
    getAll: `${API_BASE_URL}/"#"`,  // we willfix the services 
    create: `${API_BASE_URL}/"#"`,
  },
  // ✅ ADDED VERIFICATION ROUTES (for future use)
  verification: {
    send: `${API_BASE_URL}/verification/send-verification`,
    verify: `${API_BASE_URL}/verification/verify-phone`,
    status: (userId: string) => `${API_BASE_URL}/verification/status/${userId}`,
  },
  // 🆕 ADMIN PANEL ENDPOINTS
  admin: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    listings: {
      getAll: `${API_BASE_URL}/admin/listings`,
      getPending: `${API_BASE_URL}/admin/listings/pending`,
      getById: (id: string) => `${API_BASE_URL}/admin/listings/${id}`,
      verify: (id: string) => `${API_BASE_URL}/admin/listings/${id}/verify`,
    },
    users: {
      getAll: `${API_BASE_URL}/admin/users`,
      getById: (id: string) => `${API_BASE_URL}/admin/users/${id}`,
      updateRole: (id: string) => `${API_BASE_URL}/admin/users/${id}/role`,
      toggleActive: (id: string) => `${API_BASE_URL}/admin/users/${id}/active`,
    }
  }
};

// Helper function for API calls (keep your existing one)
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

// 🆕 ADMIN API REQUEST HELPER (with authentication)
export const adminApiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required for admin access');
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};
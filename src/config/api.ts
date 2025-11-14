export const API_BASE_URL = 'https://kodisha-backend-vjr9.onrender.com/api';

export const API_ENDPOINTS = {
  // Authentication (your existing endpoints)
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    me: `${API_BASE_URL}/auth/me`,
    // ✅ ADDED VERIFICATION ENDPOINTS
    verifyPhone: `${API_BASE_URL}/auth/verify-phone`,
    resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  },
  // Properties (your existing endpoints)
  properties: {
    getAll: `${API_BASE_URL}/listings`,
    create: `${API_BASE_URL}/listings`,
    getById: (id: string) => `${API_BASE_URL}/listings/${id}`,
  },
  // Services (we'll add these later)
  services: {
    getAll: `${API_BASE_URL}/services`,
    create: `${API_BASE_URL}/services`,
  },
  // ✅ ADDED VERIFICATION ROUTES (for future use)
  verification: {
    send: `${API_BASE_URL}/verification/send-verification`,
    verify: `${API_BASE_URL}/verification/verify-phone`,
    status: (userId: string) => `${API_BASE_URL}/verification/status/${userId}`,
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
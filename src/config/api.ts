// Environment-aware API configuration
// Use environment variables for different environments (dev/staging/production)

/**
 * Get the API base URL based on environment
 */
const getApiBaseUrl = (): string => {
  // Development environment
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Use explicit env var if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Production fallback
  return 'https://kodisha-backend-vjr9.onrender.com/api';
};

/**
 * Get the Socket.IO URL based on environment
 */
const getSocketUrl = (): string => {
  // Development environment
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }

  // Use explicit env var if set
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }

  // Production fallback
  return 'https://kodisha-backend-vjr9.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    apiUrl: API_BASE_URL,
    socketUrl: SOCKET_URL,
    environment: process.env.NODE_ENV,
  });
}

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    loginOtpRequest: `${API_BASE_URL}/auth/login-otp/request`,
    loginOtpVerify: `${API_BASE_URL}/auth/login-otp/verify`,
    emailOtpRequest: `${API_BASE_URL}/auth/email-otp/request`,
    emailOtpVerify: `${API_BASE_URL}/auth/email-otp/verify`,
    passwordReset: `${API_BASE_URL}/auth/password/reset`,
    me: `${API_BASE_URL}/auth/me`,
    verifyPhone: `${API_BASE_URL}/auth/verify-phone`,
    resendVerification: `${API_BASE_URL}/auth/resend-verification`,
    registerAdmin: `${API_BASE_URL}/auth/register-admin`,
  },
  verification: {
    send: `${API_BASE_URL}/verification/send`,
    verify: `${API_BASE_URL}/verification/verify`,
  },
  properties: {
    getAll: `${API_BASE_URL}/listings`,
    create: `${API_BASE_URL}/listings`,
    getById: (id: string) => `${API_BASE_URL}/listings/${id}`,
    markSold: (id: string) => `${API_BASE_URL}/listings/${id}/mark-sold`,
  },
  services: {
    equipment: {
      list: `${API_BASE_URL}/services/equipment`,
      create: `${API_BASE_URL}/services/equipment`,
    },
    professional: {
      list: `${API_BASE_URL}/services/professional`,
      create: `${API_BASE_URL}/services/professional`,
    },
    agrovets: {
      list: `${API_BASE_URL}/agrovets`,
      create: `${API_BASE_URL}/agrovets`,
    },
    products: {
      list: `${API_BASE_URL}/products`,
      create: `${API_BASE_URL}/products`,
      markSold: (id: string) => `${API_BASE_URL}/products/${id}/mark-sold`,
    },
  },
  messages: {
    send: `${API_BASE_URL}/messages`,
    threads: `${API_BASE_URL}/messages/threads`,
    withUser: (id: string) => `${API_BASE_URL}/messages/with/${id}`,
    markRead: (id: string) => `${API_BASE_URL}/messages/mark-read/${id}`,
  },
  favorites: {
    list: `${API_BASE_URL}/favorites`,
    toggle: `${API_BASE_URL}/favorites/toggle`,
  },
  reports: {
    submit: (sellerId: string) => `${API_BASE_URL}/reports/${sellerId}`,
  },
  users: {
    getProfile: (userId: string) => `${API_BASE_URL}/users/${userId}`,
    uploadProfilePicture: `${API_BASE_URL}/users/profile-picture/upload`,
    deleteProfilePicture: `${API_BASE_URL}/users/profile-picture`,
    deleteAccount: `${API_BASE_URL}/users/delete-account`,
    reactivateAccount: `${API_BASE_URL}/users/reactivate-account`,
  },
  admin: {
    login: `${API_BASE_URL}/admin-auth/login`,
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    listings: {
      getAll: `${API_BASE_URL}/admin/listings`,
      getPending: `${API_BASE_URL}/admin/listings/pending`,
       getApproved: `${API_BASE_URL}/admin/listings/approved`,
      getById: (id: string) => `${API_BASE_URL}/admin/listings/${id}`,
      verify: (id: string) => `${API_BASE_URL}/admin/listings/${id}/verify`,
      delete: (id: string) => `${API_BASE_URL}/admin/listings/${id}`,
    },
    users: {
      getAll: `${API_BASE_URL}/admin/users`,
      getById: (id: string) => `${API_BASE_URL}/admin/users/${id}`,
      updateRole: (id: string) => `${API_BASE_URL}/admin/users/${id}/role`,
      toggleActive: (id: string) => `${API_BASE_URL}/admin/users/${id}/active`,
      verify: (id: string) => `${API_BASE_URL}/admin/users/${id}/verify`,
    },
    profiles: {
      getPending: `${API_BASE_URL}/admin/profiles/pending`,
      verify: (userId: string) => `${API_BASE_URL}/admin/profiles/${userId}/verify`,
      reject: (userId: string) => `${API_BASE_URL}/admin/profiles/${userId}/reject`,
    },
    reports: {
      getAll: `${API_BASE_URL}/reports`,
      getByUser: (userId: string) => `${API_BASE_URL}/reports/user/${userId}`,
      updateStatus: (reportId: string) => `${API_BASE_URL}/reports/${reportId}`,
    },
    sellers: {
      getDocuments: (sellerId: string) => `${API_BASE_URL}/admin/sellers/${sellerId}/documents`,
    },
  },
  payments: {
    initiateStk: `${API_BASE_URL}/payments/stk/initiate`,
  },
  ratings: {
    submit: `${API_BASE_URL}/ratings`,
    getUserRatings: (userId: string) => `${API_BASE_URL}/ratings/user/${userId}`,
  },
  moderation: {
    getFlagged: `${API_BASE_URL}/admin/moderation/flagged`,
    suspend: (userId: string) => `${API_BASE_URL}/admin/moderation/users/${userId}/suspend`,
    deleteUser: (userId: string) => `${API_BASE_URL}/admin/moderation/users/${userId}`,
    forgive: (userId: string) => `${API_BASE_URL}/admin/moderation/users/${userId}/forgive`,
  },
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) || `API error: ${response.status}`;
      const error: any = new Error(message);
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error: any) {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Request Error:', { url, error });
    }
    throw error;
  }
};

export const adminApiRequest = async (
  url: string,
  options: RequestInit = {}
) => {
  try {
    const token =
      localStorage.getItem("kodisha_admin_token") ||
      localStorage.getItem("kodisha_token") ||
      localStorage.getItem("token");

    if (!token) {
      throw new Error("Admin login required. Please sign in at /admin/login.");
    }

    const bearer = `Bearer ${token}`;
    const headers: Record<string, string> = {
      Authorization: bearer,
      ...(options.headers as Record<string, string> | undefined),
    };

    // Only set Content-Type for requests that carry a JSON body to avoid unnecessary CORS preflights on GETs
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      headers,
      mode: "cors",
      credentials: options.credentials ?? "include",
      ...options,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {
      // ignore JSON parse errors for non-JSON responses
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("kodisha_admin_token");
        localStorage.removeItem("kodisha_token");
        localStorage.removeItem("token");
        if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
          window.location.href = "/admin/login";
        }
        const message =
          (data && (data.message || data.error)) ||
          "Admin session expired or insufficient privileges. Please log in again.";
        throw new Error(message);
      }
      const message =
        (data && (data.message || data.error)) || `API error: ${response.status}`;
      const error: any = new Error(message);
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error: any) {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin API Request Error:', { url, error });
    }
    throw error;
  }
};

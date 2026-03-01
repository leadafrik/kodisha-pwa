// Environment-aware API configuration
// Use environment variables for different environments (dev/staging/production)
import {
  clearAuthSession,
  getStoredAccessToken,
  isAccessTokenExpiringSoon,
  getStoredRefreshToken,
  storeAuthSession,
} from "../utils/authSession";

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

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    facebookLogin: `${API_BASE_URL}/auth/facebook/login`,
    googleLogin: `${API_BASE_URL}/auth/google/login`,
    checkExists: `${API_BASE_URL}/auth/check-exists`,
    loginOtpRequest: `${API_BASE_URL}/auth/login-otp/request`,
    loginOtpVerify: `${API_BASE_URL}/auth/login-otp/verify`,
    emailOtpRequest: `${API_BASE_URL}/auth/request-email-otp`,
    emailOtpVerify: `${API_BASE_URL}/auth/verify-email-otp`,
    smsOtpRequest: `${API_BASE_URL}/auth/request-sms-otp`,
    smsOtpVerify: `${API_BASE_URL}/auth/verify-sms-otp`,
    passwordReset: `${API_BASE_URL}/auth/password/reset`,
    me: `${API_BASE_URL}/auth/me`,
    refreshToken: `${API_BASE_URL}/auth/refresh-token`,
    logout: `${API_BASE_URL}/auth/logout`,
    verifyPhone: `${API_BASE_URL}/auth/verify-phone`,
    resendVerification: `${API_BASE_URL}/auth/resend-verification`,
    registerAdmin: `${API_BASE_URL}/auth/register-admin`,
  },
  config: {
    public: `${API_BASE_URL}/config/public`,
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
      edit: (id: string) => `${API_BASE_URL}/products/${id}`,
      listAgain: (id: string) => `${API_BASE_URL}/products/${id}/list-again`,
      markSold: (id: string) => `${API_BASE_URL}/products/${id}/mark-sold`,
    },
  },
  unifiedListings: {
    countActive: `${API_BASE_URL}/unified-listings/count/active`,
  },
  raffle: {
    me: `${API_BASE_URL}/raffle/me`,
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

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
};

const shouldSkipRefresh = (url: string): boolean =>
  url.includes("/auth/login") ||
  url.includes("/auth/register") ||
  url.includes("/auth/facebook/login") ||
  url.includes("/auth/google/login") ||
  url.includes("/auth/refresh-token") ||
  url.includes("/auth/logout") ||
  url.includes("/request-email-otp") ||
  url.includes("/verify-email-otp") ||
  url.includes("/request-sms-otp") ||
  url.includes("/verify-sms-otp");

let refreshRequest: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (refreshRequest) return refreshRequest;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  refreshRequest = (async () => {
    const response = await fetch(API_ENDPOINTS.auth.refreshToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    const accessToken = data.accessToken || data.token;
    if (!accessToken) {
      clearAuthSession();
      return null;
    }

    storeAuthSession({
      token: accessToken,
      refreshToken: data.refreshToken || refreshToken,
      expiresIn: data.expiresIn,
    });

    return accessToken;
  })();

  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
};

export const ensureValidAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const adminToken = localStorage.getItem("kodisha_admin_token");
  if (adminToken) {
    return adminToken;
  }

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (!accessToken && refreshToken) {
    return refreshAccessToken();
  }

  if (accessToken && refreshToken && isAccessTokenExpiringSoon()) {
    return (await refreshAccessToken()) || accessToken;
  }

  return accessToken;
};

const apiRequestInternal = async (
  url: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<any> => {
  try {
    const token = typeof window !== "undefined" ? getStoredAccessToken() : null;

    const baseHeaders = normalizeHeaders(options.headers);
    const authHeader: Record<string, string> =
      token && !baseHeaders.Authorization
        ? { Authorization: `Bearer ${token}` }
        : {};

    const isFormDataBody =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...authHeader,
      ...baseHeaders,
    };
    if (!isFormDataBody && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      headers,
      credentials: options.credentials ?? "include",
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const isAdminSession =
          typeof window !== "undefined" &&
          !!localStorage.getItem("kodisha_admin_token");

        if (allowRefresh && !isAdminSession && !shouldSkipRefresh(url)) {
          const nextToken = await refreshAccessToken();
          if (nextToken) {
            return apiRequestInternal(
              url,
              {
                ...options,
                headers: {
                  ...baseHeaders,
                  Authorization: `Bearer ${nextToken}`,
                },
              },
              false
            );
          }
        }

        if (typeof window !== "undefined") {
          clearAuthSession();
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
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
      console.error('API Request Error:', { url, error });
    }
    throw error;
  }
};

export const apiRequest = async (url: string, options: RequestInit = {}) =>
  apiRequestInternal(url, options, true);

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
    const isFormDataBody =
      typeof FormData !== "undefined" && options.body instanceof FormData;
    if (options.body && !headers["Content-Type"] && !isFormDataBody) {
      headers["Content-Type"] = "application/json";
    }

    // Convert relative path to absolute URL if needed
    const absoluteUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    console.log(`[adminApiRequest] Calling: ${absoluteUrl}`);
    console.log(`[adminApiRequest] Token present: ${!!token}, Token length: ${token?.length}`);

    const response = await fetch(absoluteUrl, {
      headers,
      mode: "cors",
      credentials: options.credentials ?? "include",
      ...options,
    });

    console.log(`[adminApiRequest] Response status: ${response.status}`);
    console.log(`[adminApiRequest] Response content-type: ${response.headers.get('content-type')}`);

    let data: any = null;
    const responseText = await response.text();
    console.log(`[adminApiRequest] Response text length: ${responseText?.length || 0}, Content: ${responseText?.substring(0, 200) || 'EMPTY'}`);
    
    try {
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error(`[adminApiRequest] JSON parse error:`, parseError);
      // If response was ok but not JSON, that's a problem
      if (response.ok && responseText) {
        console.error(`[adminApiRequest] Response was OK (${response.status}) but not valid JSON`);
      }
    }

    console.log(`[adminApiRequest] Parsed response data:`, data);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log(`[adminApiRequest] Auth error (${response.status}), clearing tokens`);
        clearAuthSession();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
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
    console.error('[adminApiRequest] Error:', { url, error: error.message });
    throw error;
  }
};

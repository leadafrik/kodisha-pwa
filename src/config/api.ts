// Use environment variable for local development, fallback to production
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://kodisha-backend-vjr9.onrender.com/api";

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    loginOtpRequest: `${API_BASE_URL}/auth/login-otp/request`,
    loginOtpVerify: `${API_BASE_URL}/auth/login-otp/verify`,
    emailOtpRequest: `${API_BASE_URL}/auth/email-otp/request`,
    emailOtpVerify: `${API_BASE_URL}/auth/email-otp/verify`,
    me: `${API_BASE_URL}/auth/me`,
    verifyPhone: `${API_BASE_URL}/auth/verify-phone`,
    resendVerification: `${API_BASE_URL}/auth/resend-verification`,
    registerAdmin: `${API_BASE_URL}/auth/register-admin`,
  },
  properties: {
    getAll: `${API_BASE_URL}/listings`,
    create: `${API_BASE_URL}/listings`,
    getById: (id: string) => `${API_BASE_URL}/listings/${id}`,
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
  },
  messages: {
    send: `${API_BASE_URL}/messages`,
    threads: `${API_BASE_URL}/messages/threads`,
    withUser: (id: string) => `${API_BASE_URL}/messages/with/${id}`,
  },
  verification: {
    send: `${API_BASE_URL}/verification/send-verification`,
    verify: `${API_BASE_URL}/verification/verify-phone`,
    status: (userId: string) => `${API_BASE_URL}/verification/status/${userId}`,
  },
  admin: {
    login: `${API_BASE_URL}/admin-auth/login`,
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
      verify: (id: string) => `${API_BASE_URL}/admin/users/${id}/verify`,
    },
  },
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
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
    throw new Error(message);
  }

  return data;
};

export const adminApiRequest = async (
  url: string,
  options: RequestInit = {}
) => {
  const token =
    localStorage.getItem("kodisha_admin_token") ||
    localStorage.getItem("kodisha_token") ||
    localStorage.getItem("token");

  if (!token) {
    throw new Error("Admin login required. Please sign in at /admin/login.");
  }

  const bearer = `Bearer ${token}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: bearer,
      "x-auth-token": token,
      "x-access-token": token,
      token,
      ...options.headers,
    },
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
    throw new Error(message);
  }

  return data;
};

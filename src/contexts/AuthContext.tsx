// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, AuthContextType, UserFormData } from "../types/property";
import {
  API_ENDPOINTS,
  apiRequest,
  refreshAccessToken,
} from "../config/api";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredAccessTokenExpiry,
  getStoredRefreshToken,
  isAccessTokenExpiringSoon,
  storeAuthSession,
} from "../utils/authSession";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const isAdminRole = (role?: string) =>
  role === "admin" || role === "super_admin" || role === "moderator";

const isVerificationApproved = (candidate: any) =>
  candidate?.isVerified === true ||
  candidate?.verification?.status === "approved" ||
  (candidate?.verification?.idVerified && candidate?.verification?.selfieVerified);

const deriveVerificationStatus = (candidate: any): User["verificationStatus"] => {
  if (isVerificationApproved(candidate)) return "verified";
  if (candidate?.verification?.status === "rejected") return "rejected";
  return "pending";
};

const normalizeVerification = (candidate: any) => {
  const source = candidate?.verification;
  if (!source || typeof source !== "object") return undefined;

  const normalized = { ...source };

  // Admin approval is final and implies both checks passed.
  if (normalized.status === "approved") {
    normalized.idVerified = true;
    normalized.selfieVerified = true;
  }

  return normalized;
};

const toValidDate = (value: unknown): Date => {
  if (!value) return new Date();
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

// Map backend user -> frontend User type
const mapBackendUserToFrontendUser = (apiUser: any): User => {
  const id = apiUser._id?.toString?.() || apiUser.id || "";
  const name = apiUser.fullName || apiUser.name || "User";
  const verification = normalizeVerification(apiUser);
  const verificationStatus = deriveVerificationStatus({
    ...apiUser,
    verification,
  });

  // Check admin role FIRST, before checking userType
  let type: User["type"] = "buyer";
  if (isAdminRole(apiUser.role) || apiUser.userType === "admin") {
    type = "admin";
  } else if (apiUser.userType === "seller") {
    type = "seller";
  } else if (apiUser.userType === "buyer") {
    type = "buyer";
  } else if (apiUser.userType === "landowner") {
    // Legacy support for old types
    type = "seller";
  } else if (apiUser.userType === "farmer") {
    type = "buyer";
  }

  return {
    id,
    name,
    phone: apiUser.phone,
    email: apiUser.email,
    profilePicture: apiUser.profilePicture,
    verificationStatus,
    idPhoto: undefined,
    listings: [],
    createdAt: toValidDate(apiUser.createdAt),
    type,
    _id: apiUser._id,
    fullName: apiUser.fullName,
    userType: apiUser.userType,
    county: apiUser.county,
    isVerified: verificationStatus === "verified",
    role: apiUser.role,
    verification,
    referralCode: apiUser.referralCode,
    referredByCode: apiUser.referredByCode,
    raffle: apiUser.raffle,
  };
};

const normalizeStoredUser = (storedUser: any): User => {
  const mapped = mapBackendUserToFrontendUser(storedUser || {});
  const normalizedType: User["type"] =
    isAdminRole(storedUser?.role) ||
    storedUser?.type === "admin" ||
    storedUser?.userType === "admin"
      ? "admin"
      : (storedUser?.type || mapped.type);

  return {
    ...mapped,
    ...storedUser,
    verification: normalizeVerification(storedUser) || mapped.verification,
    id: storedUser?.id || storedUser?._id?.toString?.() || mapped.id,
    _id: storedUser?._id || mapped._id,
    name: storedUser?.name || storedUser?.fullName || mapped.name,
    fullName: storedUser?.fullName || storedUser?.name || mapped.fullName,
    type: normalizedType,
    role: storedUser?.role || mapped.role,
    verificationStatus: deriveVerificationStatus({
      ...mapped,
      ...storedUser,
      verification: normalizeVerification(storedUser) || mapped.verification,
    }),
    isVerified: isVerificationApproved({
      ...mapped,
      ...storedUser,
      verification: normalizeVerification(storedUser) || mapped.verification,
    }),
    createdAt: storedUser?.createdAt ? new Date(storedUser.createdAt) : mapped.createdAt,
  };
};

const hasCompleteIdVerification = (candidate: any) =>
  isVerificationApproved(candidate);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistUser: (apiUser: any) => User = useCallback((apiUser: any) => {
    const mappedUser = mapBackendUserToFrontendUser(apiUser);
    setUser(mappedUser);
    localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));
    return mappedUser;
  }, []);

  const persistSession: (response: any) => boolean = useCallback((response: any) => {
    const token = response?.accessToken || response?.token;
    if (!token) return false;

    storeAuthSession({
      token,
      refreshToken: response?.refreshToken,
      expiresIn: response?.expiresIn,
    });

    return true;
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const trimmed = identifier.trim();
      const payload: any = { password };
      if (trimmed.includes("@")) {
        payload.email = trimmed;
      } else {
        payload.phone = trimmed;
      }

      const res: any = await apiRequest(API_ENDPOINTS.auth.login, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success || !res.user) {
        throw new Error(res.message || "Login failed");
      }

      persistUser(res.user);
      if (persistSession(res)) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (
    accessToken: string,
    fbUserId: string,
    email: string,
    name: string
  ) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.facebookLogin, {
        method: "POST",
        body: JSON.stringify({ accessToken, fbUserId, email, name }),
      });

      if (!res.success || !res.user) {
        throw new Error(res.message || "Facebook login failed");
      }

      persistUser(res.user);
      if (persistSession(res)) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (
    idToken: string,
    googleUserId: string,
    email: string,
    name: string
  ) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.googleLogin, {
        method: "POST",
        body: JSON.stringify({ idToken, googleUserId, email, name }),
      });

      if (!res.success || !res.user) {
        throw new Error(res.message || "Google login failed");
      }

      persistUser(res.user);
      if (persistSession(res)) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserFormData): Promise<User | null> => {
    setLoading(true);
    try {
      const payload = {
        phone: userData.phone,
        email: userData.email,
        fullName: userData.name,
        password: userData.password,
        userType: userData.type || "buyer",
        county: userData.county,
        constituency: userData.constituency,
        ward: userData.ward,
        inviteCode: userData.inviteCode,
        legalConsents: userData.legalConsents,
      };

      const res: any = await apiRequest(API_ENDPOINTS.auth.register, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        throw new Error(res.message || "Registration failed");
      }

      if (res.user) {
        const mappedUser = persistUser(res.user);
        if (persistSession(res)) {
          await refreshUser();
        }
        return mappedUser;
      }

      return null;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestEmailOtp = async (email: string) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.emailOtpRequest, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to send email OTP.");
      }
    } catch (error) {
      console.error("Email OTP request error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (email: string, code: string) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.emailOtpVerify, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      if (!res.success || !res.user || !(res.accessToken || res.token)) {
        throw new Error(res.message || "Invalid code.");
      }

      persistUser(res.user);
      persistSession(res);
      await refreshUser();
    } catch (error) {
      console.error("Email OTP verify error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestSmsOtp = async (phone: string) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.smsOtpRequest, {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to send SMS OTP.");
      }
    } catch (error) {
      console.error("SMS OTP request error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifySmsOtp = async (phone: string, code: string) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.smsOtpVerify, {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });
      if (!res.success || !res.user || !(res.accessToken || res.token)) {
        throw new Error(res.message || "Invalid code.");
      }

      persistUser(res.user);
      persistSession(res);
      await refreshUser();
    } catch (error) {
      console.error("SMS OTP verify error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithEmail = async ({
    email,
    code,
    newPassword,
  }: {
    email: string;
    code: string;
    newPassword: string;
  }) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.passwordReset, {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
      });

      if (!res.success || !res.user || !(res.accessToken || res.token)) {
        throw new Error(res.message || "Password reset failed.");
      }

      persistUser(res.user);
      persistSession(res);
      await refreshUser();
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    void fetch(API_ENDPOINTS.auth.logout, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setUser(null);
    clearAuthSession();
  };

  const refreshUser = useCallback(async () => {
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.me);
      if (res.success && res.user) {
        return persistUser(res.user);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
    return null;
  }, [persistUser]);

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        const savedUser = localStorage.getItem("kodisha_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const normalized = normalizeStoredUser(parsed);
          setUser(normalized);
          localStorage.setItem("kodisha_user", JSON.stringify(normalized));
        }
      } catch (e) {
        console.error("Failed to load saved user", e);
      }

      try {
        const refreshToken = getStoredRefreshToken();
        const accessToken = getStoredAccessToken();

        if (refreshToken && (!accessToken || isAccessTokenExpiringSoon(0))) {
          await refreshAccessToken();
        }

        if (getStoredAccessToken()) {
          await refreshUser();
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();
    if (!token || !user) return;

    const refreshOnFocus = async () => {
      if (refreshToken && isAccessTokenExpiringSoon(2 * 60 * 1000)) {
        await refreshAccessToken();
      }
      refreshUser();
    };

    const refreshOnVisible = async () => {
      if (document.visibilityState === "visible") {
        if (refreshToken && isAccessTokenExpiringSoon(2 * 60 * 1000)) {
          await refreshAccessToken();
        }
        refreshUser();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);

    const accessTokenExpiry = getStoredAccessTokenExpiry();
    const refreshTimeout =
      refreshToken && accessTokenExpiry
        ? window.setTimeout(async () => {
            const nextToken = await refreshAccessToken();
            if (nextToken && document.visibilityState === "visible") {
              refreshUser();
            }
          }, Math.max(accessTokenExpiry - Date.now() - 60 * 1000, 15 * 1000))
        : null;

    const shouldPoll = !hasCompleteIdVerification(user);
    const intervalId = shouldPoll
      ? window.setInterval(() => {
          if (document.visibilityState === "visible") {
            refreshUser();
          }
        }, 90 * 1000)
      : null;

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    refreshUser,
    user,
    user?.verification?.idVerified,
    user?.verification?.selfieVerified,
    user?.verification?.status,
  ]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithFacebook,
        loginWithGoogle,
        requestEmailOtp,
        verifyEmailOtp,
        requestSmsOtp,
        verifySmsOtp,
        resetPasswordWithEmail,
        logout,
        updateProfile,
        refreshUser,
        register,
        loading: loading || isBootstrapping,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

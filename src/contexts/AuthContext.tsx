// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { User, AuthContextType, UserFormData } from "../types/property";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const REFRESH_COOLDOWN_MS = 30 * 1000;

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

// Map backend user -> frontend User type
const mapBackendUserToFrontendUser = (apiUser: any): User => {
  const id = apiUser._id?.toString?.() || apiUser.id || "";
  const name = apiUser.fullName || apiUser.name || "User";

  // Check admin role FIRST, before checking userType
  let type: User["type"] = "buyer";
  if (apiUser.role === "admin") {
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
  
  // Debug log to help troubleshoot
  console.log("User mapping - role:", apiUser.role, "userType:", apiUser.userType, "mapped type:", type);

  const verificationStatus: User["verificationStatus"] = apiUser.isVerified
    ? "verified"
    : "pending";
  const rawVerification = apiUser.verification || {};
  const verificationStatusValue = String(rawVerification.status || "").toLowerCase();
  const hasPendingStatus = ["pending", "submitted", "in_review", "under_review"].includes(
    verificationStatusValue
  );
  const isApprovedStatus = ["approved", "verified"].includes(verificationStatusValue);
  const isFullyVerified = !!apiUser.isVerified || isApprovedStatus;
  const normalizedVerification = {
    ...rawVerification,
    phoneVerified: rawVerification.phoneVerified ?? apiUser.phoneVerified ?? false,
    ownershipVerified: rawVerification.ownershipVerified ?? false,
    businessVerified: rawVerification.businessVerified ?? false,
    trustScore: rawVerification.trustScore ?? 0,
    verificationLevel: rawVerification.verificationLevel ?? (isFullyVerified ? "verified" : "basic"),
    idVerified:
      !!rawVerification.idVerified ||
      !!rawVerification.selfieVerified ||
      isFullyVerified,
    selfieVerified:
      !!rawVerification.selfieVerified ||
      !!rawVerification.idVerified ||
      isFullyVerified,
    idVerificationPending: rawVerification.idVerificationPending ?? hasPendingStatus,
    idVerificationSubmitted: rawVerification.idVerificationSubmitted ?? hasPendingStatus,
  };

  return {
    id,
    name,
    phone: apiUser.phone,
    email: apiUser.email,
    profilePicture: apiUser.profilePicture,
    verificationStatus,
    idPhoto: undefined,
    listings: [],
    createdAt: new Date(),
    type,
    _id: apiUser._id,
    fullName: apiUser.fullName,
    userType: apiUser.userType,
    county: apiUser.county,
    isVerified: apiUser.isVerified,
    role: apiUser.role,
    verification: normalizedVerification,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshInFlightRef = useRef<Promise<User | null> | null>(null);
  const lastRefreshAtRef = useRef(0);

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

      const mappedUser = mapBackendUserToFrontendUser(res.user);
      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));

      if (res.token) {
        localStorage.setItem("kodisha_token", res.token);
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
    name: string,
    legalConsents?: UserFormData["legalConsents"]
  ) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.facebookLogin, {
        method: "POST",
        body: JSON.stringify({ accessToken, fbUserId, email, name, legalConsents }),
      });

      if (!res.success || !res.user) {
        throw new Error(res.message || "Facebook login failed");
      }

      const mappedUser = mapBackendUserToFrontendUser(res.user);
      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));

      if (res.token) {
        localStorage.setItem("kodisha_token", res.token);
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
    name: string,
    legalConsents?: UserFormData["legalConsents"]
  ) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.googleLogin, {
        method: "POST",
        body: JSON.stringify({ idToken, googleUserId, email, name, legalConsents }),
      });

      if (!res.success || !res.user) {
        throw new Error(res.message || "Google login failed");
      }

      const mappedUser = mapBackendUserToFrontendUser(res.user);
      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));

      if (res.token) {
        localStorage.setItem("kodisha_token", res.token);
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
        const mappedUser = mapBackendUserToFrontendUser(res.user);
        setUser(mappedUser);
        localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));
        if (res.token) {
          localStorage.setItem("kodisha_token", res.token);
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
      if (!res.success || !res.user || !res.token) {
        throw new Error(res.message || "Invalid code.");
      }

      const mappedUser = mapBackendUserToFrontendUser(res.user);
      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));
      localStorage.setItem("kodisha_token", res.token);
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
      if (!res.success || !res.user || !res.token) {
        throw new Error(res.message || "Invalid code.");
      }

      const mappedUser = mapBackendUserToFrontendUser(res.user);
      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));
      localStorage.setItem("kodisha_token", res.token);
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

      if (!res.success || !res.user || !res.token) {
        throw new Error(res.message || "Password reset failed.");
      }

      const mappedUser = mapBackendUserToFrontendUser(res.user);
      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));
      localStorage.setItem("kodisha_token", res.token);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("kodisha_user");
    localStorage.removeItem("kodisha_token");
  };

  const refreshUser = useCallback(async () => {
    const now = Date.now();
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }
    if (now - lastRefreshAtRef.current < REFRESH_COOLDOWN_MS) {
      // Return the current cached user without making a request
      const savedUser = localStorage.getItem("kodisha_user");
      try {
        return savedUser ? JSON.parse(savedUser) : null;
      } catch {
        return null;
      }
    }
    lastRefreshAtRef.current = now;

    const request = (async () => {
      try {
        const res: any = await apiRequest(API_ENDPOINTS.auth.me);
        if (res.success && res.user) {
          const mappedUser = mapBackendUserToFrontendUser(res.user);
          setUser(mappedUser);
          localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));
          return mappedUser;
        }
      } catch (err) {
        console.error("Failed to refresh user:", err);
      }
      return null;
    })();

    refreshInFlightRef.current = request;
    try {
      return await request;
    } finally {
      refreshInFlightRef.current = null;
    }
  }, []);

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("kodisha_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      }
    } catch (e) {
      console.error("Failed to load saved user", e);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("kodisha_token");
    if (!token) return;

    refreshUser();

    const handleFocus = () => {
      refreshUser();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

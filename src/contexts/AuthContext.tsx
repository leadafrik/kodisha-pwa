// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType, UserFormData } from "../types/property";
import { API_ENDPOINTS, apiRequest } from "../config/api";

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

// Map backend user -> frontend User type
const mapBackendUserToFrontendUser = (apiUser: any): User => {
  const id = apiUser._id?.toString?.() || apiUser.id || "";
  const name = apiUser.fullName || apiUser.name || "User";

  let type: User["type"] = "buyer";
  if (apiUser.userType === "landowner") type = "seller";
  else if (apiUser.userType === "farmer") type = "buyer";
  else if (apiUser.role === "admin") type = "admin";

  const verificationStatus: User["verificationStatus"] = apiUser.isVerified
    ? "verified"
    : "pending";

  return {
    id,
    name,
    phone: apiUser.phone,
    email: apiUser.email,
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
    verification: apiUser.verification,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

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

  const register = async (userData: UserFormData): Promise<User | null> => {
    setLoading(true);
    try {
      let userType: "farmer" | "landowner" | "buyer" | "service_provider" =
        "buyer";
      if (userData.type === "seller") userType = "landowner";
      if (userData.type === "buyer") userType = "farmer";
      if (userData.type === "service_provider") userType = "service_provider";

      const payload = {
        phone: userData.phone || userData.email || "email-only",
        email: userData.email,
        fullName: userData.name,
        password: userData.password,
        userType,
        county: userData.county,
        constituency: userData.constituency,
        ward: userData.ward,
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("kodisha_user");
    localStorage.removeItem("kodisha_token");
  };

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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        requestEmailOtp,
        verifyEmailOtp,
        logout,
        updateProfile,
        register,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

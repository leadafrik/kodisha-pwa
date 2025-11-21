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

// Map backend user → frontend User type
const mapBackendUserToFrontendUser = (apiUser: any): User => {
  const id = apiUser._id?.toString?.() || apiUser.id || "";
  const name = apiUser.fullName || apiUser.name || "User";

  // Map backend userType to frontend type
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

  // 🔑 Login with phone + password
  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const res: any = await apiRequest(API_ENDPOINTS.auth.login, {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || "Login failed");
      }

      const apiUser = res.data;
      const mappedUser = mapBackendUserToFrontendUser(apiUser);

      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));

      if (apiUser.token) {
        localStorage.setItem("kodisha_token", apiUser.token);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 📝 Register with your real backend
  const register = async (userData: UserFormData): Promise<User> => {
    setLoading(true);
    try {
      // Map frontend type → backend userType
      let userType: "farmer" | "landowner" | "buyer" | "service provider" =
        "buyer";
      if (userData.type === "seller") userType = "landowner";
      if (userData.type === "buyer") userType = "farmer";
      if (userData.type === "service_provider") userType = "service provider";

      const payload = {
        phone: userData.phone,
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

      if (!res.success || !res.data) {
        throw new Error(res.message || "Registration failed");
      }

      const apiUser = res.data;
      const mappedUser = mapBackendUserToFrontendUser(apiUser);

      setUser(mappedUser);
      localStorage.setItem("kodisha_user", JSON.stringify(mappedUser));

      if (apiUser.token) {
        localStorage.setItem("kodisha_token", apiUser.token);
      }

      return mappedUser;
    } catch (error) {
      console.error("Registration error:", error);
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

  // Load user from localStorage on mount
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

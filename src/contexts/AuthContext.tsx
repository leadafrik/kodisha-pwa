import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthContextType, UserFormData } from '../types/property';
import { API_ENDPOINTS, apiRequest } from '../config/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (phone: string, name: string) => {
    setLoading(true);
    try {
      // For now, we'll create a mock user since your backend auth needs testing
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        phone,
        verificationStatus: 'pending',
        listings: [],
        createdAt: new Date(),
        type: 'buyer'
      };
      
      setUser(mockUser);
      localStorage.setItem('kodisha_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserFormData) => {
    setLoading(true);
    try {
      // TODO: Replace with real API call once we test the backend
      console.log('Would register user:', userData);
      
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: userData.name,
        phone: userData.phone,
        verificationStatus: 'pending',
        listings: [],
        createdAt: new Date(),
        type: userData.type
      };
      
      setUser(mockUser);
      localStorage.setItem('kodisha_user', JSON.stringify(mockUser));
      
      return mockUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kodisha_user');
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('kodisha_user', JSON.stringify(updatedUser));
    }
  };

  // Check for existing user on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('kodisha_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateProfile,
      register,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
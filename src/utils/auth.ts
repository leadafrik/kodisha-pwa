/**
 * Auth utilities for token management and authentication helpers
 */
import {
  clearAuthSession,
  getStoredAccessToken,
  storeAuthSession,
} from "./authSession";

export const getAuthToken = (): string | null => {
  return getStoredAccessToken();
};

export const setAuthToken = (token: string, isAdmin = false): void => {
  storeAuthSession({ token, isAdmin });
};

export const clearAuthToken = (): void => {
  clearAuthSession();
};

export const isUserAdmin = (): boolean => {
  try {
    const adminToken = localStorage.getItem('kodisha_admin_token');
    if (adminToken) return true;
    
    const userStr = localStorage.getItem('kodisha_user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    return user.role === 'admin' || user.type === 'admin';
  } catch {
    return false;
  }
};

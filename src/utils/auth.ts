/**
 * Auth utilities for token management and authentication helpers
 */

export const getAuthToken = (): string | null => {
  return localStorage.getItem('kodisha_token') || localStorage.getItem('kodisha_admin_token');
};

export const setAuthToken = (token: string, isAdmin = false): void => {
  if (isAdmin) {
    localStorage.setItem('kodisha_admin_token', token);
    localStorage.removeItem('kodisha_token');
  } else {
    localStorage.setItem('kodisha_token', token);
    localStorage.removeItem('kodisha_admin_token');
  }
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('kodisha_token');
  localStorage.removeItem('kodisha_admin_token');
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

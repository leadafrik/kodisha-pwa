import axios, { AxiosError } from 'axios';
import { clearAuthSession } from './authSession';

export interface ApiError {
  message: string;
  code?: string | number;
  status?: number;
  details?: any;
}

/**
 * Handle API errors consistently across the application
 */
export const handleApiError = (error: any): ApiError => {
  // Network error or no response
  if (!error.response) {
    if (error.message === 'Network Error' || !navigator.onLine) {
      return {
        message: 'No internet connection. Please check your network and try again.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
    }
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 0,
    };
  }

  const { status, data } = error.response;

  // Handle specific status codes
  switch (status) {
    case 400:
      return {
        message: data?.message || 'Invalid request. Please check your input.',
        code: 'BAD_REQUEST',
        status: 400,
        details: data,
      };
    case 401:
      // Unauthorized - clear auth and optionally redirect (skip navigation in test environment to avoid jsdom warnings)
      clearAuthSession();
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        window.location.href = '/login';
      }
      return {
        message: 'Your session has expired. Please log in again.',
        code: 'UNAUTHORIZED',
        status: 401,
      };
    case 403:
      return {
        message: data?.message || 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        status: 403,
      };
    case 404:
      return {
        message: data?.message || 'The requested resource was not found.',
        code: 'NOT_FOUND',
        status: 404,
      };
    case 409:
      return {
        message: data?.message || 'This resource already exists.',
        code: 'CONFLICT',
        status: 409,
      };
    case 422:
      return {
        message: data?.message || 'Please check your input and try again.',
        code: 'VALIDATION_ERROR',
        status: 422,
        details: data?.errors,
      };
    case 429:
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
        status: 429,
      };
    case 500:
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: 500,
      };
    case 503:
      return {
        message: 'Service temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        status: 503,
      };
    default:
      return {
        message: data?.message || 'An error occurred. Please try again.',
        code: 'HTTP_ERROR',
        status,
        details: data,
      };
  }
};

/**
 * Wrapper for API calls with consistent error handling
 */
export const apiCall = async <T>(
  apiFn: () => Promise<T>,
  onError?: (error: ApiError) => void
): Promise<T | null> => {
  try {
    return await apiFn();
  } catch (error) {
    const apiError = handleApiError(error);
    if (onError) {
      onError(apiError);
    } else {
      console.error('API Error:', apiError);
    }
    return null;
  }
};

/**
 * Display error message to user (toast-like)
 */
export const showErrorMessage = (error: ApiError) => {
  // This can be integrated with your toast library (react-toastify, sonner, etc.)
  console.error(`[${error.code}] ${error.message}`);

  // Example: dispatch to toast context or similar
  // For now, using alert for fallback
  if (typeof window !== 'undefined') {
    // You can replace this with a proper toast notification
    const event = new CustomEvent('showError', { detail: error });
    window.dispatchEvent(event);
  }
};

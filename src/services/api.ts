import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Create axios instance for API calls
 * Base URL is configurable via environment variables
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add token to requests if available
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Handle response errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // You can dispatch a logout action or redirect to login here
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

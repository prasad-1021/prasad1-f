import axios from 'axios';
import { getMockParticipants } from './mockData';

/**
 * API Service
 * 
 * Central service for making API calls in the application.
 * Provides both a direct axios instance and a React hook pattern.
 */

// Configuration for API base URL
const API_BASE_URL = (() => {
    // Check if we're in production on Vercel
    const isVercelProduction = process.env.NODE_ENV === 'production' && 
                               process.env.VERCEL === '1';
    
    // Use environment variable if available
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    
    // Default for Vercel production
    if (isVercelProduction) {
        return 'https://eventmeeting.onrender.com';
    }
    
    // Fallback for local development and other environments
    return 'https://eventmeeting.onrender.com';
})();

// Add explicit logging of API URL for debugging
console.log('Using API base URL:', API_BASE_URL);

// Use mock data in development mode
const USE_MOCK_DATA = false;

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // Increase timeout to 15 seconds for potentially slow connections
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // This is important for handling cookies/sessions
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('cnnct_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`Request with token: ${config.method.toUpperCase()} ${config.url}`);
        } else {
            console.warn(`Request without token: ${config.method.toUpperCase()} ${config.url}`);
        }
        
        // Log request details for debugging
        console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
        
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        console.log(`API Response success: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
        return response;
    },
    async (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        console.error(`Failed API call: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        
        // Skip auth redirect for logout endpoint 401 errors
        const isLogoutEndpoint = error.config?.url?.includes('/auth/logout');
        const isLoginEndpoint = error.config?.url?.includes('/auth/login');
        
        if (error.response?.status === 401 && !isLogoutEndpoint && !isLoginEndpoint) {
            // Handle unauthorized access
            console.log('Unauthorized access - redirecting to login');
            localStorage.removeItem('cnnct_token');
            localStorage.removeItem('cnnct_user');
            localStorage.removeItem('cnnct_refresh_token');
            window.location.href = '/signin';
        }

        return Promise.reject(error);
    }
);

/**
 * Helper function to create custom hooks for components using api
 * This provides a more React-friendly way to use the API
 * @returns {Object} API methods wrapped in a hooks-friendly format
 */
export const useApi = () => {
    return {
        api,
        get: async (url, params) => {
            try {
                const response = await api.get(url, { params });
                return response.data;
            } catch (error) {
                throw error;
            }
        },
        post: async (url, data) => {
            try {
                const response = await api.post(url, data);
                return response.data;
            } catch (error) {
                throw error;
            }
        },
        put: async (url, data) => {
            try {
                const response = await api.put(url, data);
                return response.data;
            } catch (error) {
                throw error;
            }
        },
        delete: async (url) => {
            try {
                const response = await api.delete(url);
                return response.data;
            } catch (error) {
                throw error;
            }
        }
    };
};

// Export the api instance as the default export for direct usage
export default api;
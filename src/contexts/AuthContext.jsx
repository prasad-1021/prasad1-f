import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  getCurrentUser, 
  login as loginService, 
  logout as logoutService,
  register as registerService,
  refreshToken,
  isTokenExpired,
  refreshSession,
  getAuthToken
} from '../services/userService';

// Auth context
const AuthContext = createContext(null);

// Hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider wrapper
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refresh every 30 minutes
  const REFRESH_INTERVAL = 30 * 60 * 1000;
  const refreshIntervalRef = useRef(null);

  // Check if user is logged in
  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        // No token found
        console.log("No auth token found during checkAuth");
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Try to refresh token if expired
      try {
        if (isTokenExpired(token)) {
          try {
            console.log("Token expired, attempting refresh");
            await refreshToken();
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Continue with getting user data from localStorage as fallback
          }
        }
      } catch (tokenError) {
        console.error("Error checking token expiration:", tokenError);
        // Continue anyway to try to get user data
      }
      
      // Try to get user data from API
      try {
        const userData = await getCurrentUser();
        
        if (userData) {
          setUser(userData);
          return;
        }
      } catch (apiError) {
        console.error("Error getting current user from API:", apiError);
        // Fall back to localStorage if API fails
      }
      
      // If API failed, try to get user from localStorage
      try {
        const storedUserString = localStorage.getItem('cnnct_user');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString);
          console.log("Using stored user as fallback:", storedUser);
          setUser(storedUser);
        } else {
          setUser(null);
        }
      } catch (storageError) {
        console.error("Error getting user from localStorage:", storageError);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setError('Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  // Setup token refresh
  const setupTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Only set refresh if user is logged in
    if (user) {
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await refreshSession();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }, REFRESH_INTERVAL);
    }
  }, [user, REFRESH_INTERVAL]);

  // Check auth on load
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
        
        // Process user data after loading
        if (user && user.name && (!user.firstName || !user.lastName)) {
          const nameParts = user.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Update the user object with firstName and lastName
          setUser(prev => ({
            ...prev,
            firstName,
            lastName
          }));
          
          console.log('Added firstName/lastName from name field on init:', { firstName, lastName });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };
    
    initAuth();
    
    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Setup refresh when user changes
  useEffect(() => {
    setupTokenRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [setupTokenRefresh]);

  // Login user
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for user:', username);
      
      try {
        const userData = await loginService(username, password);
        
        // Log successful login
        console.log('Login successful, user data received:', {
          userId: userData.user?.id,
          hasToken: !!userData.token,
          userFields: userData.user ? Object.keys(userData.user) : []
        });
        
        // Add firstName/lastName from name field if needed
        if (userData.user && userData.user.name && (!userData.user.firstName || !userData.user.lastName)) {
          const nameParts = userData.user.name.split(' ');
          userData.user.firstName = nameParts[0] || '';
          userData.user.lastName = nameParts.slice(1).join(' ') || '';
          console.log('Added firstName/lastName from name field:', userData.user);
        }
        
        setUser(userData.user || userData);
        return userData;
      } catch (apiError) {
        console.error('Login failed with error:', apiError);
        
        // Check for HTML response or server connectivity issues
        if (apiError.message && (
            apiError.message.includes('HTML') || 
            apiError.message.includes('backend') || 
            apiError.message.includes('server') ||
            apiError.message.includes('<!DOCTYPE') ||
            apiError.message.includes('network error')
          )) {
          // More user-friendly error message for server issues
          const errorMessage = 'Cannot connect to the authentication server. Please check your internet connection and try again later.';
          setError(errorMessage);
          throw new Error(errorMessage);
        }
        
        // Pass through the original error
        setError(apiError.message || 'Login failed');
        throw apiError;
      }
    } catch (error) {
      console.error('Login process error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const newUser = await registerService(userData);
      setUser(newUser);
      return newUser;
    } catch (error) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);
      await logoutService();
      setUser(null);
      
      // Clear interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      return true;
    } catch (error) {
      setError(error.message || 'Logout failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user data
  const updateUser = (userData) => {
    console.log("Updating user data:", userData);
    
    // Update user state with new data while preserving existing fields
    setUser(prevUser => {
      if (!prevUser) return userData;
      
      const updatedUser = {
        ...prevUser,
        ...userData
      };
      
      console.log("Updated user state:", updatedUser);
      return updatedUser;
    });
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
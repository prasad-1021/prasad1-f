import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { login as loginService, register as registerService, logout as logoutService, refreshToken, getCurrentUser } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Create context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: () => {},
  register: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshSession: () => {}
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const refreshIntervalRef = useRef(null);
  const navigate = useNavigate();

  // Initial authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('cnnct_token');
        
        if (!token) {
          setUser(null);
          setLoading(false);
          setInitialAuthCheckDone(true);
          return;
        }
        
        // Token exists, try to get user data
        const userData = await getCurrentUser();
        
        if (userData) {
          console.log('User authenticated from stored token');
          setUser(userData);
        } else {
          console.log('Token exists but user data fetch failed');
          // Clear invalid token
          localStorage.removeItem('cnnct_token');
          localStorage.removeItem('cnnct_user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialAuthCheckDone(true);
      }
    };

    checkAuth();
  }, []);

  // Set up token refresh interval when authenticated
  useEffect(() => {
    if (user && !refreshIntervalRef.current) {
      console.log('Setting up token refresh interval');
      
      // Refresh every 10 minutes (600000 ms)
      refreshIntervalRef.current = setInterval(refreshSession, 600000);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user]);

  // Refresh session
  const refreshSession = async () => {
    if (!user) return false;
    
    try {
      const token = await refreshToken();
      return !!token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Token refresh failed, user needs to login again
      setUser(null);
      
      // Clear interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      // Redirect to login if not already there
      const currentPath = window.location.pathname;
      if (currentPath !== '/signin' && currentPath !== '/signup') {
        navigate('/signin');
      }
      
      return false;
    }
  };

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
        
        // Handle invalid credentials specifically for better UX
        if (apiError.message && apiError.message.includes('Invalid username or password')) {
          const errorMessage = 'The email or password you entered is incorrect. Please try again.';
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
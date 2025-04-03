import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasValidToken } from '../services/userService';
import LoadingSpinner from './LoadingSpinner';

// Local storage keys (must match those in userService.jsx)
const USER_KEY = 'cnnct_user';

// Checks login status and redirects if needed
const ProtectedRoute = ({ children, requirePreferences = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // For debugging
  useEffect(() => {
    console.log('ProtectedRoute: Current path:', currentPath);
    console.log('ProtectedRoute: Authenticated state:', isAuthenticated);
    console.log('ProtectedRoute: Loading state:', loading);
    console.log('ProtectedRoute: User in context:', user);
  }, [currentPath, isAuthenticated, loading, user]);

  // Show loader while checking auth context
  if (loading) {
    return <LoadingSpinner />;
  }

  // Check authentication from multiple sources
  // 1. From auth context
  let currentUser = user;
  let authenticated = isAuthenticated;
  
  // 2. Check if we have a valid token
  const hasToken = hasValidToken();

  // 3. If not authenticated via context but we have a token, check localStorage
  if ((!authenticated || !currentUser) && hasToken) {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        authenticated = true;
        console.log('Using stored user from localStorage as fallback with valid token');
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
  }

  // Not logged in
  if (!authenticated && !hasToken) {
    // Already on login page
    if (currentPath === '/signin' || currentPath === '/signup') {
      return null;
    }
    
    console.log('No authentication found, redirecting to signin');
    // Go to login
    return <Navigate to="/signin" />;
  }

  // Determine if we're already on the preferences page
  const isPreferencesPage = currentPath === '/preferences';

  // Check if user needs to complete preferences
  const isNewUser = sessionStorage.getItem('newUserRegistration') === 'true';
  const hasPreferences = currentUser?.preferences?.categories?.length > 0;
  
  console.log('ProtectedRoute: Has preferences:', hasPreferences);
  console.log('ProtectedRoute: Is new user:', isNewUser);
  
  // Only redirect to preferences if we need preferences, user doesn't have them,
  // and we're not already on the preferences page
  if (requirePreferences && !hasPreferences && !isPreferencesPage) {
    console.log('User needs to set preferences, redirecting to preferences page');
    return <Navigate to="/preferences" />;
  }

  // User is logged in and has necessary preferences
  return children;
};

export default ProtectedRoute; 
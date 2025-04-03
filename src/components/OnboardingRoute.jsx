import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * OnboardingRoute Component
 * 
 * A wrapper component for routes that should be accessible during the onboarding process
 * (like right after registration). It's less restrictive than ProtectedRoute,
 * but still ensures that unauthenticated users are redirected to the sign-in page.
 */
const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking user state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Render children if user exists
  return children;
};

export default OnboardingRoute; 
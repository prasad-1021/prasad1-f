/**
 * User Service
 * 
 * Provides API methods for user authentication and profile management
 */

import axios from 'axios';
import { mockUsers, mockTokens, simulateApiDelay, simulateApiError, addMockUser, updateMockUser } from './mockData';

// Use mock data if in development mode or API_URL is not set
const USE_MOCK_DATA = false;
// Update API URL to use Render backend by default
const API_URL = process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api';

// Local storage keys
const USER_KEY = 'cnnct_user';
const TOKEN_KEY = 'cnnct_token';
const REFRESH_TOKEN_KEY = 'cnnct_refresh_token';

/**
 * Get the current authenticated user from local storage
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.log('No token found in local storage');
      return null;
    }
    
    console.log('Fetching current user with token', token.substring(0, 10) + '...');
    
    try {
      // Use auth/me endpoint which is actually implemented on the backend
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Current user API response:', response.data);
      
      if (response.data?.success === false) {
        console.error('API returned error:', response.data.message);
        return null;
      }
      
      const userData = response.data.data || response.data;
      
      // Process name into firstName/lastName if needed
      if (userData && userData.name && (!userData.firstName || !userData.lastName)) {
        const nameParts = userData.name.split(' ');
        userData.firstName = nameParts[0] || '';
        userData.lastName = nameParts.slice(1).join(' ') || '';
        console.log('Added firstName/lastName fields from name:', userData);
      }
      
      return userData;
    } catch (apiError) {
      console.error('API error fetching current user:', apiError.response?.data || apiError.message);
      return null;
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Get the current auth token from local storage
 * @returns {string|null} Auth token or null if not found
 */
export const getAuthToken = () => {
  // Skip on auth pages
  if (
    window.location.pathname === '/signin' || 
    window.location.pathname === '/signup' ||
    window.location.pathname === '/landing' ||
    window.location.pathname === '/'
  ) {
    return null;
  }
  
  const token = localStorage.getItem(TOKEN_KEY);
  return token;
};

/**
 * Check if a JWT token is expired
 * @param {string} [token] - The JWT token to check, defaults to the token from localStorage
 * @returns {boolean} True if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token) => {
  // Get token from storage if not provided
  token = token || localStorage.getItem(TOKEN_KEY);
  if (!token) return true;
  
  try {
    // Validate token format (should be in format xxx.yyy.zzz)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format:', token.substring(0, 10) + '...');
      return true;
    }
    
    // Get payload part
    const base64Url = parts[1];
    if (!base64Url) {
      console.error('Invalid token payload part');
      return true;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(window.atob(base64));
    
    // Validate expiration time exists
    if (!decodedPayload.exp) {
      console.error('Token has no expiration time');
      return true;
    }
    
    const expiryTime = decodedPayload.exp * 1000; // Convert to ms
    
    // Check expiry
    return Date.now() > expiryTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    // If any error occurs during validation, consider the token expired/invalid
    return true;
  }
};

/**
 * Refresh the authentication token
 * @returns {Promise<Object>} New token data
 */
export const refreshToken = async () => {
  try {
    // Simulate error for testing
    simulateApiError(0.05); // 5% chance of error
    
    // Get new tokens
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });
    
    const data = response.data.data || response.data;
    
    // Save new tokens
    if (data && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
      
      return data.token;
    } else {
      throw new Error('Invalid token response');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // Clear expired tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    throw error;
  }
};

/**
 * Check and refresh session if necessary
 * @returns {Promise<boolean>} True if session is valid, false otherwise
 */
export const refreshSession = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  
  try {
    // Only refresh if expired or about to expire (5 min buffer)
    const isExpired = isTokenExpired(token);
    
    // Check if token is about to expire using the current time plus buffer
    const fiveMinutesInMs = 5 * 60 * 1000;
    const isAlmostExpired = (() => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        
        const base64Url = parts[1];
        if (!base64Url) return true;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(window.atob(base64));
        
        if (!decodedPayload.exp) return true;
        
        const expiryTime = decodedPayload.exp * 1000; // Convert to ms
        return (Date.now() + fiveMinutesInMs) > expiryTime;
      } catch (error) {
        console.error('Error checking if token is almost expired:', error);
        return true;
      }
    })();
    
    if (isExpired || isAlmostExpired) {
      try {
        return await refreshToken();
      } catch (error) {
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error in refreshSession:', error);
    return null;
  }
};

/**
 * Ensure URL is properly formatted for the API server
 * @param {string} url - The URL to format
 * @returns {string} Properly formatted URL
 */
const formatApiUrl = (url) => {
  // If URL starts with http, assume it's a full URL
  if (url.startsWith('http')) {
    return url;
  }

  // If the URL is relative (starts with /), append to the base API URL
  if (url.startsWith('/')) {
    // Extract domain from API_URL (e.g., http://localhost:5000)
    const domain = API_URL.split('/api')[0];
    return `${domain}${url}`;
  }

  // Otherwise, ensure we have the full API URL
  return `${API_URL}/${url.replace(/^api\//, '')}`;
};

/**
 * Make an authenticated API request
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export const authenticatedRequest = async (url, options = {}) => {
  console.log(`authenticatedRequest called for URL: ${url}`);
  
  // Ensure URL is properly formatted
  const formattedUrl = formatApiUrl(url);
  console.log(`Formatted URL: ${formattedUrl}`);
  
  const token = getAuthToken();
  
  if (!token) {
    console.error('No token found in localStorage');
    return { success: false, message: 'No authentication token found' };
  }
  
  console.log('Token found, checking expiration');
  
  // Add more detailed token debugging
  try {
    const payload = token.split('.')[1];
    if (payload) {
      const decodedPayload = JSON.parse(atob(payload));
      const expiryTime = decodedPayload.exp * 1000; // Convert to milliseconds
      const remainingTime = expiryTime - Date.now();
      const isExpired = remainingTime <= 0;
      
      console.log(`Token details:
        - User ID: ${decodedPayload.id || decodedPayload.userId || 'unknown'}
        - Expires: ${new Date(expiryTime).toLocaleString()}
        - Remaining time: ${Math.round(remainingTime / 1000)} seconds
        - Is expired: ${isExpired}
      `);
    }
  } catch (error) {
    console.error('Error decoding token for debugging:', error);
  }
  
  // Check if token is expired or about to expire
  if (isTokenExpired(token)) {
    console.log('Token is expired or about to expire, attempting refresh');
    try {
      // Attempt to refresh the token
      await refreshToken();
      console.log('Token refresh successful');
    } catch (error) {
      // If refresh fails, log out the user but don't redirect immediately
      console.error('Token refresh failed:', error);
      logout(false); // Don't redirect immediately
      return { success: false, message: 'Session expired. Please log in again.' };
    }
  }
  
  // Get the (potentially refreshed) token
  const currentToken = getAuthToken();
  if (!currentToken) {
    console.error('No token available after refresh attempt');
    return { success: false, message: 'Authentication failed' };
  }
  
  const requestOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  console.log(`Making authenticated request to: ${formattedUrl}`);
  console.log('Request options:', { 
    method: requestOptions.method || 'GET',
    headers: { 
      Authorization: 'Bearer ****' + currentToken.slice(-5), // Show only last 5 chars for security
      'Content-Type': requestOptions.headers['Content-Type']
    },
    body: requestOptions.body ? 'Request has body' : 'No body' 
  });
  
  try {
    const response = await fetch(formattedUrl, requestOptions);
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // If unauthorized, logout but don't redirect immediately
      if (response.status === 401) {
        console.error('Unauthorized response received');
        logout(false); // Don't redirect immediately
        return { success: false, message: 'Session expired. Please log in again.' };
      }
      
      const error = await response.json();
      console.error('Request failed with error:', error);
      return { success: false, message: error.message || 'Failed to make authenticated request' };
    }
    
    const responseData = await response.json();
    console.log('Response data received:', 
      Array.isArray(responseData) 
        ? `Array with ${responseData.length} items` 
        : responseData.data 
          ? `Object with data property containing ${Array.isArray(responseData.data) ? responseData.data.length : 'object'}`
          : 'Object without data property'
    );
    // Normalize response to always have success property
    if (typeof responseData.success === 'undefined') {
      return { ...responseData, success: true };
    }
    return responseData;
  } catch (error) {
    console.error('Error in authenticatedRequest:', error);
    return { success: false, message: error.message || 'Network error' };
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User and token data
 */
export const register = async (userData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.1);
    
    // Check if email already exists
    if (mockUsers.some(u => u.email === userData.email)) {
      throw new Error('Email already in use');
    }
    
    // Create a simple username based on first name (lowercase) + last initial
    const firstName = userData.firstName.toLowerCase();
    const lastInitial = userData.lastName.charAt(0).toLowerCase();
    const generatedUsername = `${firstName}${lastInitial}`;
    
    // Create new mock user
    const newUser = {
      id: `usr-${mockUsers.length + 1}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: generatedUsername,
      name: userData.name, // Include the name field
      // Store mock password for development logging (would never do this in production!)
      _devPassword: 'password', // For development reference only
      preferences: {
        categories: []
      }
    };
    
    // Log the created user for debugging
    console.log('Registered new user:', {
      email: newUser.email,
      username: newUser.username,
      password: 'password' // Reminder of the mock password for testing
    });
    
    const createdUser = addMockUser(newUser);
    
    // Save user and token to local storage
    localStorage.setItem(USER_KEY, JSON.stringify(createdUser));
    localStorage.setItem(TOKEN_KEY, mockTokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, mockTokens.refreshToken);
    
    return { user: createdUser, ...mockTokens };
  }
  
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  const data = await response.json();
  console.log('Registration response:', data);
  
  // Handle different token formats from backend
  const token = data.token || data.accessToken;
  const refreshTokenValue = data.refreshToken;
  
  if (!token) {
    console.error('No token received in registration response:', data);
    // Create a minimal user object without token auth
    localStorage.setItem(USER_KEY, JSON.stringify(data.user || userData));
    return data;
  }
  
  // Save user and token to local storage
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(TOKEN_KEY, token);
  
  if (refreshTokenValue) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
  }
  
  console.log('Saved auth data to localStorage:', {
    user: !!data.user,
    token: `${token.substring(0, 10)}...`,
    refreshToken: refreshTokenValue ? 'present' : 'missing'
  });
  
  return data;
};

/**
 * Update the user's profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user profile data
 */
export const updateUserProfile = async (profileData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.1);
    
    // Get current user
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update user in mock data
    const updatedUser = updateMockUser(user.id, profileData);
    
    // Update local storage
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  }
  
  console.log('Updating user profile with data:', profileData);
  
  try {
    // Call the API to update user data - using the correct endpoint
    const response = await authenticatedRequest(`${API_URL}/auth/updatedetails`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    console.log('Profile update API response:', response);

    if (!response.success) {
      console.error('Profile update API failed:', response);
      throw new Error(response.message || 'Failed to update profile');
    }

    // Get current user from storage
    const currentUser = await getCurrentUser();
    
    // Create updated user object with response data or fallback to provided data
    const userData = response.data || profileData;
    
    const updatedUser = {
      ...currentUser,
      name: userData.name,
      firstName: userData.firstName || profileData.firstName,
      lastName: userData.lastName || profileData.lastName,
      email: userData.email || profileData.email
    };
    
    console.log('Updating user in local storage:', updatedUser);
    
    // Update user in local storage
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param {string} identifier - User identifier (email or username)
 * @param {string} password - User password
 * @returns {Promise<Object>} User and token data
 */
export const login = async (identifier, password) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.1); // 10% chance of error for testing
    
    // First check for exact username match
    let user = mockUsers.find(u => u.username === identifier);
    
    // If not found, try case-insensitive match
    if (!user) {
      const lowerUsername = identifier.toLowerCase();
      user = mockUsers.find(u => u.username.toLowerCase() === lowerUsername);
    }
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    // Create a clean user object with required fields
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      preferences: user.preferences || {}
    };
    
    // Save user and token to local storage
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, mockTokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, mockTokens.refreshToken);
    
    return { user: userData, ...mockTokens };
  }
  
  console.log('Starting login process for:', identifier);
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: identifier, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
    
    const data = await response.json();
    console.log('Login response structure:', {
      hasUser: !!data.user,
      hasToken: !!data.token || !!data.accessToken,
      hasRefreshToken: !!data.refreshToken,
      responseKeys: Object.keys(data)
    });
    
    // Handle different token response structures
    const token = data.token || data.accessToken;
    if (!token) {
      console.error('No token in login response. Response data:', data);
      throw new Error('Login failed: No token received');
    }
    
    // Make sure we have a user object
    const userObject = data.user || { 
      email: identifier,
      username: identifier
    };
    
    // Save user and token to local storage
    localStorage.setItem(USER_KEY, JSON.stringify(userObject));
    localStorage.setItem(TOKEN_KEY, token);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    
    // Verify data was saved
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    console.log('Storage verification:', {
      tokenSaved: !!savedToken,
      userSaved: !!savedUser,
      tokenMatch: savedToken === token
    });
    
    return data;
  } catch (error) {
    // Check for connection refused error
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Cannot connect to server. Please check if the backend server is running.');
      throw new Error('Cannot connect to server. Please start the backend with "npm run backend"');
    }
    throw error;
  }
};

/**
 * Logout the current user
 * @param {boolean} redirect - Whether to redirect after logout (default: true)
 */
export const logout = (redirect = true) => {
  // Clear all authentication data
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  
  if (redirect) {
    // Check if already on signin page to prevent infinite redirect
    const currentPath = window.location.pathname;
    if (currentPath !== '/signin' && currentPath !== '/signup') {
      // Redirect to login page only if not already there
      window.location.href = '/signin';
    }
  }
};

/**
 * Update the user's password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */
export const updatePassword = async (currentPassword, newPassword) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.1);
    
    // Simple mock password check
    if (currentPassword !== 'password') {
      throw new Error('Current password is incorrect');
    }
    
    return { success: true, message: 'Password updated successfully' };
  }
  
  console.log('Updating password with auth endpoint');
  
  try {
    // Use the auth endpoint for password updates
    const response = await authenticatedRequest(`${API_URL}/auth/updatepassword`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    
    console.log('Password update response:', response);
    
    if (!response.success) {
      console.error('Password update failed:', response);
      throw new Error(response.message || 'Failed to update password');
    }
    
    return response;
  } catch (error) {
    console.error('Error updating password:', error);
    
    // Try the users endpoint as fallback
    try {
      console.log('Trying users endpoint as fallback');
      const fallbackResponse = await authenticatedRequest(`${API_URL}/users/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      console.log('Fallback password update response:', fallbackResponse);
      return fallbackResponse;
    } catch (fallbackError) {
      console.error('Fallback password update also failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};

/**
 * Reset the user's password without current password verification
 * (for admin or password reset flows)
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */
export const resetPassword = async (newPassword) => {
  console.log('Resetting password without verification');
  
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.1);
    return { success: true, message: 'Password reset successfully' };
  }
  
  try {
    // Try the dedicated password reset endpoint first
    const response = await authenticatedRequest(`${API_URL}/users/password/reset`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
    
    console.log('Password reset response:', response);
    return response;
  } catch (error) {
    console.error('Error resetting password:', error);
    
    // As a fallback, try using a blank current password with the regular endpoint
    try {
      return await updatePassword('', newPassword);
    } catch (fallbackError) {
      console.error('Fallback password reset also failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};

/**
 * Check if a valid token exists
 * @returns {boolean} True if valid token exists
 */
export const hasValidToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    // Check basic token structure
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};
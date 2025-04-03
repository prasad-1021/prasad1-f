/**
 * Login a user with better error handling
 * @param {string} identifier - User identifier (email or username)
 * @param {string} password - User password
 * @returns {Promise<Object>} User and token data
 */
export const login = async (identifier, password) => {
  console.log('Starting login process for:', identifier);
  
  try {
    // Use axios instead of fetch for better error handling
    debugLog('Sending login request to:', `${API_URL}/auth/login`);
    
    // Better connection handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: identifier, 
      password
    }, {
      // Add proper headers
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      validateStatus: function (status) {
        // Only treat 2xx status codes as successful
        return status >= 200 && status < 300;
      },
      transformResponse: [(data) => {
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Handle empty responses
        if (!data) return { success: false, message: 'Empty response from server' };
        
        // Check if response contains HTML (often indicates server error)
        if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
          console.error('Server returned HTML instead of JSON');
          return { 
            success: false, 
            message: 'Server returned HTML instead of JSON. The backend may be unavailable.' 
          };
        }
        
        // Try to parse as JSON
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          return { 
            success: false, 
            message: 'Invalid JSON response from server' 
          };
        }
      }]
    });
    
    debugLog('Login response status:', response.status);
    const data = response.data;
    
    // Check for explicit error in transformed data
    if (data.success === false) {
      throw new Error(data.message || 'Login failed');
    }
    
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
    if (error.message === 'Network Error') {
      console.error('Cannot connect to server. Please check if the backend server is running.');
      throw new Error('Cannot connect to server. Please check if the backend is available');
    }
    
    // Handle abort/timeout errors
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      console.error('Request timed out');
      throw new Error('Connection timed out. Please try again later.');
    }
    
    // Handle 401 unauthorized explicitly
    if (error.response && error.response.status === 401) {
      console.error('Invalid credentials (401 Unauthorized)');
      throw new Error('Invalid username or password');
    }
    
    // Handle HTML responses (which indicate a server error)
    if (error.response && error.response.headers['content-type'] && 
        error.response.headers['content-type'].includes('text/html')) {
      console.error('Backend server returned HTML instead of JSON:', error);
      throw new Error('Backend server error. Please try again later or contact support');
    }
    
    // Log detailed error information
    debugLog('Login error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      }
    });
    
    // Extract error message from response if available
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    console.error('Login error:', errorMessage);
    throw new Error(errorMessage);
  }
};
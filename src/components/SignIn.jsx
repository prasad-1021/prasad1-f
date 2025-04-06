import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/SignIn.module.css';
import { LogoSVG } from '../assets/ImagePlaceholders.jsx';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const SignIn = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', // Changed from identifier to username
    password: ''
  });
  
  // Check if user is already logged in
  useEffect(() => {
    if (auth.isAuthenticated && !auth.loading) {
      // If already authenticated, redirect to events page
      navigate('/events');
    }
  }, [auth.isAuthenticated, auth.loading, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    try {
      setLoading(true);
      await auth.login(formData.username, formData.password);
      successToast('Welcome back!');
      navigate('/events'); // No replace:true to avoid infinite loops
    } catch (error) {
      console.error('Login error:', error);
      errorToast(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signInPage}>
      <div className={styles.signInContainer}>
        <div className={styles.formSide}>
          <div className={styles.logoContainer}>
            <Link to="/" className={styles.logo}>
              <LogoSVG />
              <span className={styles.logoText}>CNNCT</span>
            </Link>
          </div>
          
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Sign in</h1>
            
            <form className={styles.signInForm} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  name="username"
                  className={styles.formInput}
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={styles.formInput}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={togglePasswordVisibility}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {showPassword ? (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#676B5F" />
                    ) : (
                      <path d="M12 6.5C15.79 6.5 19.17 8.63 20.82 12C19.17 15.37 15.79 17.5 12 17.5C8.21 17.5 4.83 15.37 3.18 12C4.83 8.63 8.21 6.5 12 6.5ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 9.5C10.62 9.5 9.5 10.62 9.5 12C9.5 13.38 10.62 14.5 12 14.5C13.38 14.5 14.5 13.38 14.5 12C14.5 10.62 13.38 9.5 12 9.5ZM12 7.5C14.48 7.5 16.5 9.52 16.5 12C16.5 14.48 14.48 16.5 12 16.5C9.52 16.5 7.5 14.48 7.5 12C7.5 9.52 9.52 7.5 12 7.5Z" fill="#676B5F" />
                    )}
                  </svg>
                </button>
              </div>
              
              <button 
                type="submit" 
                className={styles.loginBtn}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
            
            <div className={styles.signUpLink}>
              <span>Don't have an account?</span>
              <Link to="/signup">Sign up</Link>
            </div>
            
            <div className={styles.termsText}>
              This site is protected by reCAPTCHA and the
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Google Privacy Policy</a> and
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> Terms of Service</a> apply.
            </div>
          </div>
        </div>
        
        <div className={styles.imageSide}>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './SignIn.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const SignIn = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Email/Username is required';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setServerError('');
    
    // Validate form
    if (!validate()) return;
    
    try {
      // Show a loading message
      console.log('Attempting login...');
      
      // Clear any previous errors
      setFormErrors({});
      
      // Try to login
      await login(username, password);
      
      // Login successful
      successToast('Login successful!');
      navigate('/events');
    } catch (error) {
      console.error('Login error:', error);
      
      // Determine if this is an invalid credentials error
      if (error.message && (
          error.message.includes('incorrect') || 
          error.message.includes('Invalid') || 
          error.message.includes('not found')
        )) {
        setFormErrors({
          credentials: 'The email or password you entered is incorrect.'
        });
      } else if (error.message && error.message.includes('connect')) {
        // Connection error
        setServerError('Cannot connect to the server. Please check your internet connection.');
      } else {
        // Generic error
        setServerError(error.message || 'Login failed. Please try again.');
      }
      
      errorToast(error.message || 'Login failed');
    }
  };

  return (
    <div className={styles.signinContainer}>
      <div className={styles.signinBox}>
        <h2 className={styles.title}>Welcome back!</h2>
        <p className={styles.subtitle}>Sign in to access your account</p>
        
        {serverError && (
          <div className={styles.errorAlert}>
            {serverError}
          </div>
        )}
        
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>Email</label>
            <input
              id="username"
              type="text"
              className={`${styles.input} ${formErrors.username || formErrors.credentials ? styles.inputError : ''}`}
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {formErrors.username && (
              <div className={styles.errorText}>{formErrors.username}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={`${styles.input} ${formErrors.password || formErrors.credentials ? styles.inputError : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {formErrors.password && (
              <div className={styles.errorText}>{formErrors.password}</div>
            )}
            {formErrors.credentials && (
              <div className={styles.errorText}>{formErrors.credentials}</div>
            )}
          </div>
          
          <div className={styles.formOptions}>
            <div className={styles.rememberMe}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="rememberMe" className={styles.checkboxLabel}>Remember me</label>
            </div>
            
            <Link to="/forgot-password" className={styles.forgotPassword}>
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className={styles.signinButton}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className={styles.signupPrompt}>
            Don't have an account? <Link to="/signup" className={styles.signupLink}>Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
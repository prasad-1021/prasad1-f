import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/SignUp.module.css';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Check if this is a new user registration
      const isNewUser = sessionStorage.getItem('newUserRegistration') === 'true';
      
      if (isNewUser) {
        // If it's a new user, they should go to preferences
        navigate('/preferences');
      } else {
        // If already authenticated and not a new user, redirect to events page
        navigate('/events');
      }
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Add debugging for auth context
  useEffect(() => {
    console.log("Auth context in SignUp:", register);
  }, [register]);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };
  
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password) {
      errorToast('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      errorToast('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      errorToast('Please agree to the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare user data
      const userData = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };
      
      // Register the user
      const response = await register(userData);
      
      if (response && response.user) {
        // Set flag in session storage to indicate new user registration
        sessionStorage.setItem('newUserRegistration', 'true');
        
        successToast('Account created successfully! Please set your preferences.');
        // Redirect to preferences page - avoid replace:true to maintain navigation history
        navigate('/preferences');
      } else {
        throw new Error('Registration failed - no user data received');
      }
    } catch (error) {
      console.error('Registration error:', error);
      errorToast(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signUpPage}>
      <div className={styles.signUpContainer}>
        <div className={styles.formSide}>
          <div className={styles.logoContainer}>
            <Link to="/" className={styles.logo}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25.6911 26.0563C27.3407 25.6435 28.5711 25.2323 28.5711 25.2323C28.9498 25.0389 29.2667 24.7431 29.4856 24.3785C29.7046 24.0139 29.8168 23.5951 29.8095 23.1699V20.6947C29.1743 22.9436 27.7001 24.8628 25.6911 26.0563ZM27.3407 18.6339L24.4607 17.3955V19.0403C24.3781 19.7648 24.1536 20.466 23.8 21.1037C23.4464 21.7415 22.9706 22.3033 22.3999 22.7571C22.8127 22.7571 22.8127 23.1699 22.8127 23.5827L22.3999 24.4067L24.0495 25.2323C27.3487 23.9939 28.1743 20.2835 28.5855 18.2211L27.3407 18.6339ZM16.2063 23.5827C15.7504 22.8293 15.4684 21.9837 15.3807 21.1075V27.7059C15.424 28.019 15.569 28.3091 15.7935 28.5315H17.0303C18.741 28.42 20.4175 28.0005 21.9791 27.2931C20.8022 27.1405 19.6739 26.7286 18.6756 26.0869C17.6772 25.4453 16.8339 24.5899 16.2063 23.5827ZM19.5055 15.3347C19.4845 15.784 19.6316 16.225 19.9183 16.5715C20.3295 16.5715 20.7423 16.5715 21.1551 15.7459C21.5679 14.9203 21.1551 14.0963 20.3295 14.0963C20.0975 14.2149 19.8999 14.391 19.7556 14.6078C19.6113 14.8247 19.5252 15.075 19.5055 15.3347ZM15.7935 12.8595V17.8083C16.024 16.123 16.6734 14.5224 17.6821 13.1529C18.6908 11.7833 20.0268 10.6884 21.5679 9.96833L17.0303 11.2051C16.2063 11.2099 15.7935 12.0355 15.7935 12.8595ZM14.1439 12.8595C14.0878 12.1033 14.3077 11.3523 14.7628 10.7458C15.2179 10.1392 15.8773 9.71804 16.6191 9.56033L26.9279 7.08673L18.2687 3.78753H16.6191L5.07188 6.26113C5.07188 6.26113 3.83348 6.67393 3.83348 7.49793V8.32033L3.00948 9.97313V12.4467L2.18388 12.8595V13.6851L3.00948 14.0963V16.1603L3.83348 17.3971V22.7587C3.83107 22.8678 3.85079 22.9762 3.89143 23.0775C3.93207 23.1787 3.99279 23.2707 4.06994 23.3479C4.14709 23.425 4.23906 23.4857 4.34031 23.5264C4.44157 23.567 4.55 23.5867 4.65908 23.5843C5.48308 23.9955 10.8447 26.4643 14.1439 27.7075V12.8595ZM24.4543 12.8595L27.3343 14.0963L28.1599 13.6851C27.6578 13.0554 27.2414 12.3619 26.9215 11.6227C26.1695 11.1651 25.324 10.8829 24.4479 10.7971L24.4543 12.8595ZM28.9903 8.32033L23.2175 9.55713C24.0153 9.34227 24.8559 9.34358 25.6531 9.56093C26.4502 9.77828 27.1751 10.2038 27.7535 10.7939C28.2481 11.0988 28.6584 11.523 28.9466 12.0276C29.2348 12.5321 29.3918 13.101 29.4031 13.6819V8.32033C29.4031 7.91073 28.9903 7.91073 28.9903 8.32033ZM30.8687 6.24033C30.5651 5.93369 30.1737 5.72904 29.7487 5.65473L19.1615 1.58593C18.7181 1.34412 18.2226 1.21356 17.7176 1.20548C17.2126 1.1974 16.7132 1.31203 16.2623 1.53953C14.6447 1.94433 4.83828 3.98913 4.67028 4.02753C3.86607 4.19261 3.14175 4.62587 2.61592 5.25634C2.09008 5.88682 1.7939 6.67715 1.77588 7.49793V7.76673L1.01588 9.28033L0.959877 11.2419L0.134277 11.6547V14.7635L0.545477 15.1763V16.7571L1.37108 17.9939V22.7571C1.38593 23.4118 1.5891 24.0484 1.95628 24.5906C2.32345 25.1329 2.83908 25.5579 3.44148 25.8147C3.96948 25.9907 6.42068 27.0355 8.79028 28.0451C14.6479 30.5411 15.3087 30.7955 15.5951 30.7955H16.4207L17.3455 30.7859C18.9327 30.5219 22.8911 29.2995 25.7839 28.4067C27.1791 27.9747 28.6223 27.5299 28.7919 27.4979L29.0671 27.4307C29.9091 27.0842 30.6276 26.4928 31.1294 25.7331C31.6312 24.9733 31.8932 24.0804 31.8815 23.1699V8.73633C31.9303 8.26913 31.8635 7.7971 31.6868 7.36183C31.5102 6.92656 31.2292 6.54141 30.8687 6.24033ZM30.6431 23.1715C30.6501 23.8368 30.4585 24.489 30.0928 25.0448C29.7271 25.6006 29.204 26.0347 28.5903 26.2915C28.2703 26.3539 27.5551 26.5699 25.4127 27.2323C22.5551 28.1139 18.6399 29.3235 17.2367 29.5651L15.6863 29.5763C15.2719 29.4755 11.7999 27.9955 9.26548 26.9155C6.65428 25.7955 4.39828 24.8355 3.90228 24.6755C3.52722 24.5088 3.20607 24.2408 2.97488 23.9016C2.74369 23.5625 2.61161 23.1656 2.59348 22.7555V17.6227L1.76788 16.3859V14.6675L1.35668 14.2547V12.4147L2.18068 12.0003V9.70593L2.94068 8.18593L3.00628 7.49793C3.00628 7.09793 3.00628 5.87873 4.99028 5.21313C5.39508 5.12993 14.9199 3.14433 16.6863 2.68673C16.9922 2.526 17.3334 2.44402 17.6789 2.44822C18.0245 2.45241 18.3635 2.54263 18.6655 2.71073L29.3855 6.83553L29.6063 6.87713C29.7545 6.91897 29.8891 6.99897 29.9967 7.10913C30.2411 7.29666 30.4298 7.54722 30.5425 7.8339C30.6553 8.12057 30.6878 8.43255 30.6367 8.73633L30.6431 23.1715Z" fill="#1877F2"/>
              </svg>
              <span className={styles.logoText}>CNNCT</span>
            </Link>
          </div>
          
          <div className={styles.formContainer}>
            <div className={styles.titleContainer}>
              <h2 className={styles.title}>Create an account</h2>
              <Link to="/signin" className={styles.signInLink}>Sign in instead</Link>
            </div>
            
            <form className={styles.signUpForm} onSubmit={handleSubmit} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">First name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={`${styles.formInput} ${errors.firstName ? styles.inputError : ''}`}
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
                {errors.firstName && <div className={styles.errorMessage}>{errors.firstName}</div>}
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="lastName">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={`${styles.formInput} ${errors.lastName ? styles.inputError : ''}`}
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                />
                {errors.lastName && <div className={styles.errorMessage}>{errors.lastName}</div>}
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
                {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`${styles.formInput} ${errors.password ? styles.inputError : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={() => togglePasswordVisibility('password')}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`${styles.formInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={() => togglePasswordVisibility('confirm')}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
                {errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
              </div>
              
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  className={styles.checkbox}
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="agreeToTerms" className={styles.termsLabel}>
                  By creating an account, I agree to our <Link to="/terms" className={styles.termsLink}>Terms of use</Link> and <Link to="/privacy" className={styles.termsLink}>Privacy Policy</Link>
                </label>
              </div>
              {errors.agreeToTerms && <div className={styles.errorMessage}>{errors.agreeToTerms}</div>}
              
              <button 
                type="submit" 
                className={styles.createAccountBtn}
                disabled={loading}
              >
                Create an account
              </button>
            </form>
            
            <div className={styles.termsText}>
              <span className={styles.termsTextPart}>This site is protected by reCAPTCHA and the</span>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>
              <span className={styles.termsTextAnd}>and</span>
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              <span className={styles.termsTextApply}>apply.</span>
            </div>
          </div>
        </div>
        
        <div className={styles.imageSide}>
          {/* Image side with background */}
        </div>
      </div>
    </div>
  );
};

export default SignUp; 
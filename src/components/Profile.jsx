import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/Profile.module.css';
import frameBg from '../assets/Frame.png';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, updatePassword } from '../services/userService';

/**
 * Profile Component
 * 
 * Allows users to manage their profile settings including
 * first name, last name, email, and password.
 */
const Profile = () => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    // Pre-populate form data from user context when user data is available
    if (user) {
      console.log("User data from context:", user);
      
      // Extract firstName and lastName from name if needed
      let firstName = user.firstName || '';
      let lastName = user.lastName || '';
      
      // If we have name but not firstName/lastName, split the name field
      if (user.name && (!firstName || !lastName)) {
        const nameParts = user.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        password: '************',
        confirmPassword: '************'
      });
      
      console.log("Form data populated:", {
        firstName,
        lastName,
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Track if password field is modified
    if (name === 'password' && value !== '************') {
      setPasswordChanged(true);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      errorToast("Please fill in all required fields");
      return;
    }

    if (passwordChanged && formData.password !== formData.confirmPassword) {
      errorToast("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      console.log("Current user data:", user);
      
      // Update profile info
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };
      
      console.log("Sending profile data to API:", profileData);
      
      // Update profile on server
      const result = await updateUserProfile(profileData);
      console.log("Profile update result:", result);
      
      // Update password if changed
      if (passwordChanged && formData.password !== '************') {
        console.log("Updating password");
        await updatePassword(formData.password);
      }
      
      // Update local user context
      updateUser({
        ...profileData,
        name: `${profileData.firstName} ${profileData.lastName}`
      });
      
      console.log("User context updated with:", {
        ...profileData,
        name: `${profileData.firstName} ${profileData.lastName}`
      });
      
      // Show success toast
      successToast("Profile updated successfully");
      setShowToast(true);
    } catch (error) {
      console.error("Profile update error:", error);
      errorToast(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  // If user data is not loaded yet, show a loading state
  if (!user) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.mainContent}>
          <div className={styles.profileHeader}>
            <h1 className={styles.profileTitle}>Loading profile...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      {/* Toast Notification */}
      {showToast && (
        <div className={styles.toast}>
          <div className={styles.toastBody}>
            <div className={styles.checkIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="white" />
              </svg>
            </div>
            <div className={styles.toastMessage}>Profile updated successfully</div>
            <button className={styles.closeToast} onClick={() => setShowToast(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <Link to="/" className={styles.logoLink}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 10.5001C28 6.08174 24.4183 2.50006 20 2.50006H12C7.58172 2.50006 4 6.08174 4 10.5001V22.5001C4 26.9183 7.58172 30.5001 12 30.5001H20C24.4183 30.5001 28 26.9183 28 22.5001V10.5001Z" fill="#1877F2" />
              </svg>
            </div>
            <div className={styles.logoText}>CNNCT</div>
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          <Link to="/events" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12L10 10M10 10L12 8M10 10L8 8M10 10L12 12M4 6L2 8L4 10M4 10L6 8L4 6M4 10V20M20 18V4M4 6H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V10" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Events</span>
          </Link>
          <Link to="/booking" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#676767" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 2V6M8 2V6M3 10H21M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="#676767" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Booking</span>
          </Link>
          <Link to="/availability" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="#676767" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Availability</span>
          </Link>
          <Link to="/profile" className={`${styles.navLink} ${styles.active}`}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19.4 15C19.1277 15.8031 19.2583 16.6718 19.75 17.35C20.0781 17.8046 20.0781 18.4015 19.75 18.856L18.856 19.75C18.4015 20.0781 17.8046 20.0781 17.35 19.75C16.6718 19.2583 15.8031 19.1277 15 19.4C14.2049 19.6648 13.6508 20.3082 13.57 21.13C13.5299 21.6148 13.1148 22 12.63 22H11.37C10.8852 22 10.4701 21.6148 10.43 21.13C10.3492 20.3082 9.79508 19.6648 9 19.4C8.19692 19.1277 7.32825 19.2583 6.65 19.75C6.19544 20.0781 5.59856 20.0781 5.144 19.75L4.25 18.856C3.92192 18.4015 3.92192 17.8046 4.25 17.35C4.74167 16.6718 4.87231 15.8031 4.6 15C4.33524 14.2049 3.69175 13.6508 2.87 13.57C2.38524 13.5299 2 13.1148 2 12.63V11.37C2 10.8852 2.38524 10.4701 2.87 10.43C3.69175 10.3492 4.33524 9.79508 4.6 9C4.87231 8.19692 4.74167 7.32825 4.25 6.65C3.92192 6.19544 3.92192 5.59856 4.25 5.144L5.144 4.25C5.59856 3.92192 6.19544 3.92192 6.65 4.25C7.32825 4.74167 8.19692 4.87231 9 4.6C9.79508 4.33524 10.3492 3.69175 10.43 2.87C10.4701 2.38524 10.8852 2 11.37 2H12.63C13.1148 2 13.5299 2.38524 13.57 2.87C13.6508 3.69175 14.2049 4.33524 15 4.6C15.8031 4.87231 16.6718 4.74167 17.35 4.25C17.8046 3.92192 18.4015 3.92192 18.856 4.25L19.75 5.144C20.0781 5.59856 20.0781 6.19544 19.75 6.65C19.2583 7.32825 19.1277 8.19692 19.4 9C19.6648 9.79508 20.3082 10.3492 21.13 10.43C21.6148 10.4701 22 10.8852 22 11.37V12.63C22 13.1148 21.6148 13.5299 21.13 13.57C20.3082 13.6508 19.6648 14.2049 19.4 15Z" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Settings</span>
          </Link>
        </nav>

        {/* User Profile */}
        <div className={styles.userProfile}>
          <div className={styles.avatarContainer}>
            <img src={frameBg} alt="User" className={styles.avatar} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.name
                  ? user.name
                  : user?.username
                    ? user.username
                    : 'Guest User'}
            </span>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>Profile</h1>
          <p className={styles.profileSubtitle}>Manage settings for your profile</p>
        </div>

        <div className={styles.profileContainer}>
          <div className={styles.tabs}>
            <div className={`${styles.tab} ${styles.activeTab}`}>Edit Profile</div>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>First name</label>
              <input
                type="text"
                name="firstName"
                className={styles.fieldInput}
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Last name</label>
              <input
                type="text"
                name="lastName"
                className={styles.fieldInput}
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                type="email"
                name="email"
                className={styles.fieldInput}
                value={formData.email}
                onChange={handleChange}
                disabled
                placeholder="Your email address"
              />
              <small className={styles.fieldHelp}>Email cannot be changed</small>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Password</label>
              <input
                type="password"
                name="password"
                className={styles.fieldInput}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={styles.fieldInput}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button 
            className={styles.saveButton} 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
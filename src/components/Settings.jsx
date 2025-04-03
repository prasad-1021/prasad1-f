import React, { useState, useEffect } from 'react';
import styles from '../styles/Settings.module.css';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, updatePassword, resetPassword, authenticatedRequest } from '../services/userService';

const API_URL = process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api';

/**
 * Settings Component
 * 
 * Allows users to manage their profile settings including
 * first name, last name, email, and password.
 */
const Settings = () => {
  const { successToast, errorToast } = useToast();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-populate form data from user context
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '************',
        confirmPassword: '************'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      errorToast("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      errorToast("Passwords do not match");
      return;
    }

    // Create a new formData object for API call
    const updatedFormData = { ...formData };
    
    // Check if we need to update password (different from placeholder)
    const isPasswordChanged = updatedFormData.password !== '************' && 
                            updatedFormData.password.trim() !== '';
    
    console.log('Submitting profile update with data:', {
      ...updatedFormData,
      password: isPasswordChanged ? '********' : updatedFormData.password 
    });
    console.log('Password changed:', isPasswordChanged);
    setLoading(true);

    try {
      // Create profile data object with only the fields to update
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      };
      
      console.log('Calling updateUserProfile API with data:', profileData);
      
      // Make API call to update profile
      const response = await updateUserProfile(profileData);
      console.log('Update profile API response:', response);
      
      // Update local user context
      updateUser(profileData);
      
      // Then update password if changed
      if (isPasswordChanged) {
        try {
          console.log('Updating password...');
          
          // Use the resetPassword function for password changes without verification
          const passwordResponse = await resetPassword(formData.password);
          
          console.log('Password update response:', passwordResponse);
          
          if (passwordResponse.success) {
            successToast("Profile and password updated successfully");
          } else {
            // Profile updated but password failed
            errorToast("Failed to save password");
          }
        } catch (passwordError) {
          console.error('Password update error:', passwordError);
          errorToast("Failed to save password");
        }
      } else {
        // Just profile was updated
        successToast("Successfully saved");
      }
    } catch (error) {
      console.error('Profile update error:', error);
      errorToast(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.mainContent}>
      {/* Remove the old success notification */}

      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>Manage settings for your profile</p>
      </div>

      <div className={styles.profileContainer}>
        <div className={styles.tabs}>
          <div className={`${styles.tab} ${styles.activeTab}`}>Edit Profile</div>
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>First name</label>
            <input
              type="text"
              name="firstName"
              className={styles.fieldInput}
              value={formData.firstName}
              onChange={handleChange}
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
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Password</label>
            <input
              type="password"
              name="password"
              className={styles.fieldInput}
              value={formData.password}
              onChange={handleChange}
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
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings; 
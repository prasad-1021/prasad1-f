import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { successToast, errorToast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Profile data state
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        password: '************',
        confirmPassword: '************'
    });

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle save
    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.firstName.trim()) {
            errorToast('First name is required');
            return;
        }
        
        if (!formData.email.trim()) {
            errorToast('Email is required');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            errorToast('Passwords do not match');
            return;
        }
        
        setLoading(true);
        
        try {
            // Simulate API call
            console.log('Saving profile data:', formData);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            successToast('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            errorToast(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.headerSection}>
                <h1 className={styles.title}>Profile</h1>
                <p className={styles.description}>
                    Manage settings for your profile
                </p>
            </div>
            
            <div className={styles.contentFrame}>
                <div className={styles.tabSection}>
                    <div className={styles.tabItem}>Edit Profile</div>
                    <div className={styles.tabIndicator}></div>
                    <div className={styles.tabDivider}></div>
                </div>
                
                <form className={styles.profileForm} onSubmit={handleSave}>
                    <div className={styles.formGroup}>
                        <label htmlFor="firstName" className={styles.label}>
                            First name
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            className={styles.input}
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="lastName" className={styles.label}>
                            Last name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            className={styles.input}
                            value={formData.lastName}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className={styles.input}
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className={styles.input}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className={styles.saveButton}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage; 
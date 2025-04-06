import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { IoAdd } from "react-icons/io5";
import styles from './Sidebar.module.css';
import { useAuth } from '../../contexts/AuthContext';
import logoSvg from '../../assets/logo.svg';
import eventsSvg from '../../assets/events.svg';
import bookingSvg from '../../assets/booking.svg';
import availableSvg from '../../assets/available.svg';
import settingsSvg from '../../assets/settings.svg';
import logoutSvg from '../../assets/logout.svg';
import signoutSvg from '../../assets/signout.svg';
import boySvg from '../../assets/boy.svg';
import axios from 'axios';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get the token from localStorage
                const token = localStorage.getItem('cnnct_token');
                if (!token) return;
                
                // First try the auth/me endpoint
                try {
                    const authResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api'}/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    
                    console.log('Auth API Response:', authResponse.data);
                    console.log('Auth API User Structure:', {
                        hasName: !!authResponse.data?.data?.name,
                        hasFirstName: !!authResponse.data?.data?.firstName,
                        hasLastName: !!authResponse.data?.data?.lastName,
                        hasUsername: !!authResponse.data?.data?.username,
                        hasEmail: !!authResponse.data?.data?.email,
                        nameValue: authResponse.data?.data?.name,
                        userKeys: Object.keys(authResponse.data?.data || {})
                    });
                    
                    if (authResponse.data && (authResponse.data.data || authResponse.data)) {
                        const userData = authResponse.data.data || authResponse.data;
                        console.log('Setting userData from auth API:', userData);
                        setUserData(userData);
                        return; // Exit if this was successful
                    }
                } catch (authError) {
                    console.log('Auth endpoint failed, trying users/me endpoint:', authError);
                }
                
                // If auth/me failed, try the users/me endpoint as fallback
                const response = await axios.get(`${process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api'}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                console.log('Users API Response:', response.data);
                
                if (response.data && (response.data.data || response.data)) {
                    const userData = response.data.data || response.data;
                    console.log('Setting userData from users API:', userData);
                    setUserData(userData);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };
        
        fetchUserData();
        
        // Add user as a dependency so we refetch when user changes (after login)
    }, [user]);

    const handleCreateClick = () => {
        navigate('/create-event');
    };
    
    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    // Determine the display name - use userData from MongoDB if available, fall back to context user
    const displayUser = userData || user;
    console.log('Current Auth Context user:', user);
    console.log('Current MongoDB userData:', userData);
    console.log('displayUser being used:', displayUser);
    
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarTop}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <img 
                            src={logoSvg}
                            alt="CNNCT Logo"
                            className={styles.plugIcon}
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxWidth: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                    <h1 className={styles.logoText}>CNNCT</h1>
                </div>
            </div>

            <div className={styles.sidebarMain}>
                <nav className={styles.navigation}>
                    <NavLink 
                        to="/events" 
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        <div className={styles.linkIcon}>
                            <img 
                                src={eventsSvg}
                                alt="Events"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <span>Events</span>
                    </NavLink>

                    <NavLink 
                        to="/booking" 
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        <div className={styles.linkIcon}>
                            <img 
                                src={bookingSvg}
                                alt="Booking"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <span>Booking</span>
                    </NavLink>

                    <NavLink 
                        to="/availability" 
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        <div className={styles.linkIcon}>
                            <img 
                                src={availableSvg}
                                alt="Availability"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <span>Availability</span>
                    </NavLink>

                    <NavLink 
                        to="/settings" 
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        <div className={styles.linkIcon}>
                            <img 
                                src={settingsSvg}
                                alt="Settings"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <span>Settings</span>
                    </NavLink>
                </nav>

                <button onClick={handleCreateClick} className={styles.createButton}>
                    <IoAdd className={styles.addIcon} />
                    <span>Create</span>
                </button>
            </div>

            <div className={styles.userDrawer}>
                <button onClick={handleLogout} className={styles.signOutButton}>
                    <img 
                        src={logoutSvg}
                        alt="Sign out"
                        className={styles.signOutIcon}
                        style={{
                            width: '24px',
                            height: 'auto',
                            maxWidth: '100%',
                            objectFit: 'contain'
                        }}
                    />
                    <img 
                        src={signoutSvg}
                        alt="Sign out"
                        style={{
                            height: 'auto',
                            maxWidth: '100%',
                            objectFit: 'contain'
                        }}
                    />
                </button>

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>
                        {displayUser?.profileImage ? (
                            <img src={displayUser.profileImage} alt={displayUser.name || 'User'} />
                        ) : (
                            <img 
                                src={boySvg}
                                alt="Default Avatar"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '50%'
                                }}
                            />
                        )}
                    </div>
                    <span className={styles.userName}>
                        {(() => {
                            // Helper function to get full name from parts
                            const getFullName = (user) => {
                                if (user?.firstName && user?.lastName) {
                                    return `${user.firstName} ${user.lastName}`.trim();
                                }
                                if (user?.firstName) {
                                    return user.firstName;
                                }
                                if (user?.name) {
                                    return user.name;
                                }
                                return null;
                            };
                            
                            // First try MongoDB data
                            const mongoName = getFullName(userData);
                            if (mongoName) return mongoName;
                            
                            // Then try Auth context
                            const authName = getFullName(user);
                            if (authName) return authName;
                            
                            // Fall back to username/email
                            if (userData?.username) return userData.username;
                            if (user?.username) return user.username;
                            if (userData?.email) return userData.email;
                            if (user?.email) return user.email;
                            
                            // Last resort
                            if (userData?._id || user?._id || userData?.id || user?.id) {
                                return "User";
                            }
                            
                            return 'Guest User';
                        })()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 
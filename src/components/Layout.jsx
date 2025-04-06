import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Layout.module.css';
import { LogoSVG } from '../assets/ImagePlaceholders.jsx';
import { useAuth } from '../contexts/AuthContext';
import frameBg from '../assets/Frame.png';

/**
 * Layout Component
 * 
 * A reusable layout component that provides consistent sidebar navigation
 * across all pages. Includes logo, navigation links, create button, and user profile.
 */
const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className={styles.pageContainer}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Link to="/" className={styles.logoLink}>
            <LogoSVG />
            <span className={styles.logoText}>CNNCT</span>
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav className={styles.sidebarNav}>
          <Link to="/events" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12L10 10M10 10L12 8M10 10L8 8M10 10L12 12M4 6L2 8L4 10M4 10L6 8L4 6M4 10V20M20 18V4M4 6H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Events</span>
          </Link>
          <Link to="/booking" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V6M8 2V6M3 10H21M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Booking</span>
          </Link>
          <Link to="/availability" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Availability</span>
          </Link>
          <Link to="/settings" className={styles.navLink}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.1277 15.8031 19.2583 16.6718 19.75 17.35C20.0781 17.8046 20.0781 18.4015 19.75 18.856L18.856 19.75C18.4015 20.0781 17.8046 20.0781 17.35 19.75C16.6718 19.2583 15.8031 19.1277 15 19.4C14.2049 19.6648 13.6508 20.3082 13.57 21.13C13.5299 21.6148 13.1148 22 12.63 22H11.37C10.8852 22 10.4701 21.6148 10.43 21.13C10.3492 20.3082 9.79508 19.6648 9 19.4C8.19692 19.1277 7.32825 19.2583 6.65 19.75C6.19544 20.0781 5.59856 20.0781 5.144 19.75L4.25 18.856C3.92192 18.4015 3.92192 17.8046 4.25 17.35C4.74167 16.6718 4.87231 15.8031 4.6 15C4.33524 14.2049 3.69175 13.6508 2.87 13.57C2.38524 13.5299 2 13.1148 2 12.63V11.37C2 10.8852 2.38524 10.4701 2.87 10.43C3.69175 10.3492 4.33524 9.79508 4.6 9C4.87231 8.19692 4.74167 7.32825 4.25 6.65C3.92192 6.19544 3.92192 5.59856 4.25 5.144L5.144 4.25C5.59856 3.92192 6.19544 3.92192 6.65 4.25C7.32825 4.74167 8.19692 4.87231 9 4.6C9.79508 4.33524 10.3492 3.69175 10.43 2.87C10.4701 2.38524 10.8852 2 11.37 2H12.63C13.1148 2 13.5299 2.38524 13.57 2.87C13.6508 3.69175 14.2049 4.33524 15 4.6C15.8031 4.87231 16.6718 4.74167 17.35 4.25C17.8046 3.92192 18.4015 3.92192 18.856 4.25L19.75 5.144C20.0781 5.59856 20.0781 6.19544 19.75 6.65C19.2583 7.32825 19.1277 8.19692 19.4 9C19.6648 9.79508 20.3082 10.3492 21.13 10.43C21.6148 10.4701 22 10.8852 22 11.37V12.63C22 13.1148 21.6148 13.5299 21.13 13.57C20.3082 13.6508 19.6648 14.2049 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Settings</span>
          </Link>
        </nav>

        {/* Create Button */}
        <Link to="/create-event" className={styles.createButton}>
          <svg className={styles.plusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Create</span>
        </Link>

        {/* User Profile */}
        <div className={styles.userProfile}>
          <div className={styles.avatarContainer}>
            <img src={frameBg} alt="User" className={styles.avatar} />
          </div>
          <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 
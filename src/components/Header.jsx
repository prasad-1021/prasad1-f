import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Header.module.css';
import logo from '../assets/logo.svg';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <img src={logo} alt="Logo" className={styles.responsiveImage} />
        </div>
        <div className={styles.logoText}>CNNCT</div>
      </div>
      
      <div className={styles.navContainer}>
        <Link to="/signin" className={styles.loginButton}>
        </Link>
        <Link to="/signup">
          <button className={styles.signupButton}>
            <span className={styles.signupText}>Sign up free</span>
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header; 
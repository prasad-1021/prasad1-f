import React from 'react';
import styles from '../styles/LoadingSpinner.module.css';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component to display during data fetching operations
 */
const LoadingSpinner = ({ size = 'medium', fullPage = false }) => {
  const spinnerClass = `${styles.spinner} ${styles[size]} ${fullPage ? styles.fullPage : ''}`;
  
  return (
    <div className={fullPage ? styles.spinnerContainer : ''}>
      <div className={spinnerClass}>
        <div className={styles.bounce1}></div>
        <div className={styles.bounce2}></div>
        <div className={styles.bounce3}></div>
      </div>
      {fullPage && <p className={styles.loadingText}>Loading...</p>}
    </div>
  );
};

export default LoadingSpinner; 
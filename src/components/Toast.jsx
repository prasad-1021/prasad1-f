import React, { useState, useEffect } from 'react';
import styles from '../styles/Toast.module.css';

const Toast = ({ type, message, onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeOutTimer;
    let closeTimer;
    
    if (duration && duration > 0) {
      // Start fade out animation slightly before removing
      const fadeOutDelay = Math.max(duration - 300, 0);
      fadeOutTimer = setTimeout(() => {
        setVisible(false);
      }, fadeOutDelay);
      
      // Ensure we call onClose after the full duration
      closeTimer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
    }
    
    // Clean up timers when component unmounts or duration changes
    return () => {
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for fade-out animation
  };

  const getIcon = () => {
    if (type === 'success') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="white" />
        </svg>
      );
    } else if (type === 'error') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={`${styles.toastContainer} ${styles[type]} ${visible ? styles.visible : styles.hidden}`}>
      <div className={styles.contentWrapper}>
        {getIcon()}
        <span className={styles.message}>{message}</span>
      </div>
      <button className={styles.closeButton} onClick={handleClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white" />
        </svg>
      </button>
    </div>
  );
};

export default Toast; 
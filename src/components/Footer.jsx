import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';
import insta from '../assets/insta.svg';
import yt from '../assets/yt.svg';
import ban from '../assets/ban.svg';
import bwlogo from '../assets/bwlogo.svg';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.authButtonsContainer}>
          <Link to="/signin" className={styles.loginButton}>
            Log in
          </Link>
          <Link to="/signup" className={styles.signupButton}>
            Sign up free
          </Link>
        </div>

        <div className={styles.footerLinksContainer}>
          <div className={styles.linksColumn}>
            <Link to="/about" className={styles.columnTitle}>About CNNCT</Link>
            <Link to="/blog" className={styles.footerLink}>Blog</Link>
            <Link to="/press" className={styles.footerLink}>Press</Link>
            <Link to="/social-good" className={styles.footerLink}>Social Good</Link>
            <Link to="/contact" className={styles.footerLink}>Contact</Link>
          </div>

          <div className={styles.linksColumn}>
            <Link to="/careers" className={styles.columnTitle}>Careers</Link>
            <Link to="/getting-started" className={styles.footerLink}>Getting Started</Link>
            <Link to="/features" className={styles.footerLink}>Features and How-Tos</Link>
            <Link to="/faqs" className={styles.footerLink}>FAQs</Link>
            <Link to="/report" className={styles.footerLink}>Report a Violation</Link>
          </div>

          <div className={styles.linksColumn}>
            <Link to="/terms" className={styles.columnTitle}>Terms and Conditions</Link>
            <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            <Link to="/cookie" className={styles.footerLink}>Cookie Notice</Link>
            <Link to="/trust" className={styles.footerLink}>Trust Center</Link>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <div className={styles.acknowledgement}>
            <p>
              We acknowledge the Traditional Custodians of the land on which our office stands, The Wurundjeri 
              people of the Kulin Nation, and pay our respects to Elders past, present and emerging.
            </p>
          </div>

          <div className={styles.socialLinks}>
            <a href="https://x.com/i/flow/login" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.5 5.84996C20.8 6.13996 20 6.32996 19.2 6.41996C20 5.92996 20.7 5.13996 21 4.16996C20.2 4.64996 19.3 4.98996 18.3 5.16996C17.5 4.35996 16.4 3.86996 15.1 3.86996C12.7 3.86996 10.7 5.86996 10.7 8.26996C10.7 8.59996 10.7 8.89996 10.8 9.16996C7.2 8.98996 3.9 7.18996 1.8 4.48996C1.4 5.05996 1.2 5.77996 1.2 6.56996C1.2 7.97996 1.99 9.21996 3.2 9.91996C2.5 9.90996 1.9 9.70996 1.3 9.40996V9.46996C1.3 11.6 2.8 13.3 4.9 13.7C4.57 13.8 4.21 13.84 3.85 13.84C3.6 13.84 3.36 13.83 3.1 13.76C3.6 15.4 5.2 16.6 7 16.6C5.5 17.7 3.6 18.4 1.6 18.4C1.3 18.4 0.9 18.4 0.6 18.3C2.4 19.5 4.6 20.2 7 20.2C15.1 20.2 19.5 13.9 19.5 8.47996C19.5 8.29996 19.5 8.13996 19.5 7.96996C20.4 7.39996 21.1 6.67996 21.7 5.84996H21.5Z" fill="#222222"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/accounts/login/?hl=en" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <img src={insta} alt="Instagram" width="24" height="24" />
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <img src={yt} alt="YouTube" width="24" height="24" />
            </a>
            <a href="http://ticktok.com/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <img src={ban} alt="TikTok" width="24" height="24" />
            </a>
            <span className={styles.socialIcon}>
              <img src={bwlogo} alt="Calendly" width="24" height="24" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
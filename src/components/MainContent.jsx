import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/MainContent.module.css';
import left from '../assets/left.svg';
import right from '../assets/right.svg';
import bigimg from '../assets/bigimg.svg';
import flower from '../assets/flower.svg';

const MainContent = () => {
  // Replace these with your actual image paths when available
  const appImage = null; // e.g. '/images/app-screenshot.png'

  return (
    <>
      <section className={styles.mainSection}>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleTop}>CNNCT – Easy</span>
          <span className={styles.heroTitleBottom}>Scheduling Ahead</span>
        </h1>
        
        <Link to="/signup">
          <button className={styles.signUpButtonHero}>
            <span className={styles.signupTextHero}>Sign up free</span>
          </button>
        </Link>
        
        <div className={styles.appScreenshot}>
          <img src={bigimg} alt="CNNCT App Screenshot" className={styles.responsiveImage} />
        </div>
      </section>
      
      <section className={styles.simplifiedSection}>
        <h2 className={styles.sectionTitle}>Simplified scheduling for you and your team</h2>
        <p className={styles.sectionDescription}>
          CNNCT eliminates the back-and-forth of scheduling meetings so you can focus on what matters. 
          Set your availability, share your link, and let others book time with you instantly.
        </p>
      </section>
      
      <section className={styles.organizerSection}>
        <div className={styles.organizerContent}>
          <h2 className={styles.organizerTitle}>Stay Organized with Your Calendar & Meetings</h2>
          
          <div className={styles.organizerWrapper}>
            <p className={styles.organizerFeature}>Seamless Event Scheduling</p>
            <div className={styles.organizerListContainer}>
              <ul className={styles.organizerFeatureList}>
                <li className={styles.organizerFeatureItem}>View all your upcoming meetings and appointments in one place.</li>
                <li className={styles.organizerFeatureItem}>Syncs with Google Calendar, Outlook, and iCloud to avoid conflicts.</li>
                <li className={styles.organizerFeatureItem}>Customize event types: one-on-ones, team meetings, group sessions, and webinars.</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className={styles.calendarScreens}>
          <div className={styles.calendarScreen1}>
            <img 
              src={left} 
              alt="Calendar Interface" 
              className={styles.calendarImg} 
              loading="lazy"
            />
          </div>
          <div className={styles.calendarScreen2}>
            <img 
              src={right} 
              alt="Calendar App" 
              className={styles.calendarImg} 
              loading="lazy"
            />
          </div>
        </div>
      </section>
      
      <section className={styles.testimonialSection}>
        <div className={styles.testimonialHeader}>
          <div className={styles.testimonialTitleContainer}>
            <h2 className={styles.testimonialTitle}>
              Here's what our <span className={styles.customerBlue}>customer</span> has to says
            </h2>
          </div>
          <div className={styles.testimonialNote}>
            <div className={styles.testimonialNoteIcon}>
              <img src={flower} alt="Flower Icon" className={styles.responsiveSvg} />
            </div>
            <p className={styles.testimonialNoteText}>
              Effortlessly organize meetings and events with seamless scheduling. Syncs with Google Calendar to prevent conflicts. Trusted by users to streamline planning—discover how our webapp keeps you on track.
            </p>
          </div>
        </div>
        
        <Link to="#" className={styles.readMoreButton}>Read customer stories</Link>
      </section>
    </>
  );
};

export default MainContent; 
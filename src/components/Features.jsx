import React from 'react';
import styles from '../styles/Features.module.css';
import bluedot from '../assets/bluedot.svg';

const Features = () => {
  return (
    <section className={styles.featuresSection}>
      <div className={styles.testimonialContainer}>
        <div className={styles.testimonialCard} style={{ backgroundColor: '#DEDEDE' }}>
          <h4 className={styles.testimonialTitle}>Amazing tool! Saved me months</h4>
          <p className={styles.testimonialText}>
            This is a placeholder for your testimonials and what your client has to say, put them here and make sure its 100% true and meaningful.
          </p>
          <div className={styles.testimonialProfile}>
            <img src={bluedot} alt="Blue Dot" className={styles.testimonialAvatar} />
            <div className={styles.testimonialInfo}>
              <p className={styles.testimonialName}>John Master</p>
              <p className={styles.testimonialRole}>Director, Spark.com</p>
            </div>
          </div>
        </div>
        
        <div className={styles.testimonialCard}>
          <h4 className={styles.testimonialTitle}>Amazing tool! Saved me months</h4>
          <p className={styles.testimonialText}>
            This is a placeholder for your testimonials and what your client has to say, put them here and make sure its 100% true and meaningful.
          </p>
          <div className={styles.testimonialProfile}>
            <img src={bluedot} alt="Blue Dot" className={styles.testimonialAvatar} />
            <div className={styles.testimonialInfo}>
              <p className={styles.testimonialName}>John Master</p>
              <p className={styles.testimonialRole}>Director, Spark.com</p>
            </div>
          </div>
        </div>
        
        <div className={styles.testimonialCard}>
          <h4 className={styles.testimonialTitle}>Amazing tool! Saved me months</h4>
          <p className={styles.testimonialText}>
            This is a placeholder for your testimonials and what your client has to say, put them here and make sure its 100% true and meaningful.
          </p>
          <div className={styles.testimonialProfile}>
            <img src={bluedot} alt="Blue Dot" className={styles.testimonialAvatar} />
            <div className={styles.testimonialInfo}>
              <p className={styles.testimonialName}>John Master</p>
              <p className={styles.testimonialRole}>Director, Spark.com</p>
            </div>
          </div>
        </div>
        
        <div className={styles.testimonialCard} style={{ backgroundColor: '#DEDEDE' }}>
          <h4 className={styles.testimonialTitle}>Amazing tool! Saved me months</h4>
          <p className={styles.testimonialText}>
            This is a placeholder for your testimonials and what your client has to say, put them here and make sure its 100% true and meaningful.
          </p>
          <div className={styles.testimonialProfile}>
            <img src={bluedot} alt="Blue Dot" className={styles.testimonialAvatar} />
            <div className={styles.testimonialInfo}>
              <p className={styles.testimonialName}>John Master</p>
              <p className={styles.testimonialRole}>Director, Spark.com</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features; 
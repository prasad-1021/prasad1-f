import React from 'react';
import styles from '../styles/Integrations.module.css';
import audio from '../assets/audio.svg';
import audioback from '../assets/audioback.svg';
import band from '../assets/band.png';
import boneback from '../assets/boneback.jpg';
import bone from '../assets/bone.png';
import book from '../assets/book.png';
import gift from '../assets/gift.png';
import cameo from '../assets/cameo.png';
import thapad from '../assets/thapad.jpg';
import community from '../assets/community.png';
import contact from '../assets/contact.png';

const Integrations = () => {
  const integrations = [
    {
      id: 'audiomack',
      title: 'Audiomack',
      description: 'Add an Audiomack player to your Linktree',
      iconBg: '#FFFFFF'
    },
    {
      id: 'bandsintown',
      title: 'Bandsintown',
      description: 'Drive ticket sales by listing your events',
      iconBg: '#FFFFFF'
    },
    {
      id: 'bonfire',
      title: 'Bonfire',
      description: 'Display and sell your custom merch',
      iconBg: '#F49879'
    },
    {
      id: 'books',
      title: 'Books',
      description: 'Promote books on your Linktree',
      iconBg: '#BBBEAC'
    },
    {
      id: 'gift',
      title: 'Buy Me A Gift',
      description: 'Let visitors support you with a small gift',
      iconBg: '#780016'
    },
    {
      id: 'cameo',
      title: 'Cameo',
      description: 'Make impossible fan connections possible',
      iconBg: '#000000'
    },
    {
      id: 'clubhouse',
      title: 'Clubhouse',
      description: 'Let your community in on the conversation',
      iconBg: '#F1EFE3'
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Build an SMS subscriber list',
      iconBg: '#000000'
    },
    {
      id: 'contact',
      title: 'Contact Details',
      description: 'Easily share downloadable contact details',
      iconBg: '#992C87'
    }
  ];

  return (
    <section className={styles.integrationsSection}>
      <h2 className={styles.integrationsHeading}>All Link Apps and Integrations</h2>
      <div className={styles.integrationsContainer}>
        {integrations.map((integration) => (
          <div key={integration.id} className={styles.integrationCard}>
            <div className={styles.iconContainer}>
              <div className={styles.iconFrame} style={{ 
                backgroundColor: integration.id === 'bonfire' ? 'transparent' : integration.iconBg 
              }}>
                {integration.id === 'audiomack' ? (
                  <>
                    <img src={audioback} alt="Audio Background" className={styles.svgBackground} />
                    <img src={audio} alt="Audio" className={styles.svgIcon} />
                  </>
                ) : integration.id === 'bandsintown' ? (
                  <img src={band} alt="Bandsintown" className={styles.responsiveIcon} />
                ) : integration.id === 'bonfire' ? (
                  <>
                    <img src={boneback} alt="Bonfire Background" className={styles.svgBackground} />
                    <img src={bone} alt="Bonfire" className={styles.svgIcon} />
                  </>
                ) : integration.id === 'books' ? (
                  <img src={book} alt="Books" className={styles.responsiveIcon} />
                ) : integration.id === 'gift' ? (
                  <img src={gift} alt="Gift" className={styles.responsiveIcon} />
                ) : integration.id === 'cameo' ? (
                  <img src={cameo} alt="Cameo" className={styles.responsiveIcon} />
                ) : integration.id === 'clubhouse' ? (
                  <img src={thapad} alt="Clubhouse" className={styles.responsiveIcon} />
                ) : integration.id === 'community' ? (
                  <img src={community} alt="Community" className={styles.responsiveIcon} />
                ) : integration.id === 'contact' ? (
                  <img src={contact} alt="Contact" className={styles.responsiveIcon} />
                ) : (
                  <div className={styles.svgPlaceholder} data-icon-id={integration.id}>
                    {/* SVG will be added manually later */}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.contentContainer}>
              <h3 className={styles.title}>{integration.title}</h3>
              <p className={styles.description}>{integration.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Integrations; 
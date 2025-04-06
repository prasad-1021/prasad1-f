import React from 'react';
import Header from './Header';
import MainContent from './MainContent';
import Features from './Features';
import Integrations from './Integrations';
import Footer from './Footer';
import '../styles/landing.css';

const LandingLayout = () => {
  return (
    <div className="landing-layout">
      <Header />
      <MainContent />
      <Features />
      <Integrations />
      <Footer />
    </div>
  );
};

export default LandingLayout; 
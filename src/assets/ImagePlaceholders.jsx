import React from 'react';
import logoSvg from './logo.svg';
import profileSvg from './boy.svg';

export const LogoSVG = () => (
  <img src={logoSvg} alt="Logo" style={{ width: '32px', height: '30px' }} />
);

export const ProfileImagePlaceholder = profileSvg;

// Define the exports object as a variable before exporting it
const exports = {
  LogoSVG,
  ProfileImagePlaceholder
};

export default exports; 
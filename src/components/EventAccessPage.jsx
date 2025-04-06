import React, { useState } from 'react';

const EventAccessPage = ({ storedPassword }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasswordChange = (e) => {
    setInputPassword(e.target.value);
  };

  const handleSubmit = () => {
    if (inputPassword === storedPassword) {
      setAccessGranted(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Incorrect password. Please try again.');
    }
  };

  return (
    <div>
      {accessGranted ? (
        <div>Access Granted! Welcome to the event.</div>
      ) : (
        <div>
          <input
            type="password"
            placeholder="Enter event password"
            value={inputPassword}
            onChange={handlePasswordChange}
          />
          <button onClick={handleSubmit}>Submit</button>
          {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
        </div>
      )}
    </div>
  );
};

export default EventAccessPage; 
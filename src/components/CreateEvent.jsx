import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../styles/CreateEvent.module.css';
import { LogoSVG } from '../assets/ImagePlaceholders.jsx';
import frameBg from '../assets/Frame.png';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { createEvent } from '../services/eventService';
import LoadingSpinner from './LoadingSpinner';

/**
 * CreateEvent Component
 * 
 * Allows users to create new event types with customizable settings
 * including title, description, duration, and time settings.
 */
const CreateEvent = () => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Form state
  const [eventData, setEventData] = useState({
    eventTopic: '',
    password: '',
    hostName: user?.name || '',
    description: '',
    date: '',
    time: '02:30',
    period: 'PM',
    timeZone: '(UTC +5:00 Delhi)',
    duration: '1 hour'
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    let isValid = true;
    const errors = [];
    
    if (!eventData.eventTopic.trim()) {
      errors.push('Event topic is required');
      isValid = false;
    }
    
    if (!eventData.date.trim()) {
      errors.push('Date is required');
      isValid = false;
    }
    
    if (!eventData.hostName.trim()) {
      errors.push('Host name is required');
      isValid = false;
    }
    
    // Show validation errors
    if (!isValid) {
      errorToast(errors.join(', '));
      return;
    }
    
    setLoading(true);
    
    // Format data for API
    const formattedData = {
      title: eventData.eventTopic.trim(),
      password: eventData.password,
      host: eventData.hostName.trim(),
      description: eventData.description.trim(),
      date: eventData.date.trim(),
      timeRange: `${eventData.time} ${eventData.period}`,
      duration: eventData.duration,
      type: 'One-on-one',
      enabled: true
    };
    
    // Retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptCreateEvent = async () => {
      try {
        // Call API to create event
        await createEvent(formattedData);
        
        // Clear loading states
        setLoading(false);
        setRetryAttempt(0);
        
        successToast('Event created successfully!');
        
        // Redirect to the add-event page instead of /events
        navigate('/add-event');
      } catch (error) {
        console.error('Error creating event:', error);
        
        // If we have retries left and it's a simulated error
        if (retryCount < maxRetries && error.message === 'Simulated API error') {
          retryCount++;
          setRetryAttempt(retryCount);
          errorToast(`API error occurred. Retrying... (${retryCount}/${maxRetries})`);
          
          // Wait a moment before retrying
          setTimeout(() => {
            attemptCreateEvent();
          }, 1000);
        } else {
          // Either max retries reached or different error
          errorToast(
            error.message === 'Simulated API error'
              ? 'Failed to create event after multiple attempts. Please try again later.'
              : error.message || 'Failed to create event'
          );
          setLoading(false);
          setRetryAttempt(0);
        }
      }
    };
    
    // Start the first attempt
    await attemptCreateEvent();
  };

  const handleCancel = () => {
    // Reset states
    setLoading(false);
    setRetryAttempt(0);
    
    // Navigate back to events page
    navigate('/events');
  };

  return (
    <div className={styles.createEventPage}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <LogoSVG />
            <span>CNNCT</span>
          </div>
        </div>
        
        <div className={styles.sidebarNav}>
          <Link to="/events" className={styles.navLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 13C10 13.5523 9.55228 14 9 14C8.44772 14 8 13.5523 8 13C8 12.4477 8.44772 12 9 12C9.55228 12 10 12.4477 10 13Z" fill="currentColor"/>
              <path d="M14 13C14 13.5523 13.5523 14 13 14C12.4477 14 12 13.5523 12 13C12 12.4477 12.4477 12 13 12C13.5523 12 14 12.4477 14 13Z" fill="currentColor"/>
              <path d="M18 13C18 13.5523 17.5523 14 17 14C16.4477 14 16 13.5523 16 13C16 12.4477 16.4477 12 17 12C17.5523 12 18 12.4477 18 13Z" fill="currentColor"/>
              <path d="M8.5 18.9687C6.71602 20.1672 3.88312 20.7514 2.05255 20.9756C2.03249 20.9781 2.01228 20.9807 2 20.983M2 10V9C2 5.68629 4.68629 3 8 3H16C19.3137 3 22 5.68629 22 9V15C22 18.3137 19.3137 21 16 21H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Events</span>
          </Link>
          
          <Link to="/booking" className={styles.navLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9H21M7 3V5M17 3V5M6 13H8M6 17H8M12 13H14M12 17H14M18 13H20M18 17H20M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Booking</span>
          </Link>
          
          <Link to="/availability" className={styles.navLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L14 14M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Availability</span>
          </Link>
          
          <Link to="/settings" className={styles.navLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.1277 15.8031 19.2583 16.6718 19.7603 17.3581C20.2336 18.0085 20.0191 18.9137 19.3287 19.2836L18.5811 19.7085C17.8907 20.0784 17.0157 19.7591 16.6458 19.0687C16.2969 18.4167 15.6384 18.0005 14.9189 18.0005C14.1995 18.0005 13.5409 18.4167 13.192 19.0687C12.8222 19.7591 11.9472 20.0784 11.2568 19.7085L10.5092 19.2836C9.81881 18.9137 9.60435 18.0085 10.0776 17.3581C10.5796 16.6718 10.7102 15.8031 10.4379 15C10.1657 14.1969 9.53795 13.5691 8.73486 13.2969C7.94187 13.0279 7.41722 12.2703 7.41722 11.4283V10.5716C7.41722 9.72962 7.94187 8.97199 8.73486 8.70295C9.53795 8.43077 10.1657 7.80303 10.4379 6.99993C10.7102 6.19682 10.5796 5.32806 10.0776 4.64185C9.60435 3.99138 9.81881 3.08618 10.5092 2.71635L11.2568 2.29144C11.9472 1.92161 12.8222 2.24096 13.192 2.93135C13.5409 3.58328 14.1995 3.99949 14.9189 3.99949C15.6384 3.99949 16.2969 3.58328 16.6458 2.93135C17.0157 2.24096 17.8907 1.92161 18.5811 2.29144L19.3287 2.71635C20.0191 3.08618 20.2336 3.99138 19.7603 4.64185C19.2583 5.32806 19.1277 6.19682 19.4 6.99993C19.6722 7.80303 20.3 8.43077 21.1031 8.70295C21.8961 8.97199 22.4207 9.72962 22.4207 10.5716V11.4283C22.4207 12.2703 21.8961 13.0279 21.1031 13.2969C20.3 13.5691 19.6722 14.1969 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Settings</span>
          </Link>
        </div>
        
        <Link to="/create-event" className={styles.createButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Create</span>
        </Link>
        
        <div className={styles.userProfile}>
          <div className={styles.avatarContainer}>
            <img src={frameBg} alt="User profile" className={styles.avatar} />
          </div>
          <span className={styles.userName}>{user?.firstName || 'User'} {user?.lastName || ''}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={styles.mainContent}>
        <h1 className={styles.title}>Create Event</h1>
        <p className={styles.subtitle}>Create events to share for people to book on your calendar. New</p>
        
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <div className={styles.divider}></div>
            
            <div className={styles.formGroup}>
              <label htmlFor="eventTopic" className={styles.label}>
                Event Topic <span className={styles.required}>*</span>
              </label>
              <input
                id="eventTopic"
                name="eventTopic"
                type="text"
                className={styles.input}
                placeholder="Set a conference topic before it starts"
                value={eventData.eventTopic}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={styles.input}
                placeholder="Password"
                value={eventData.password}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="hostName" className={styles.label}>
                Host name <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <input
                  id="hostName"
                  name="hostName"
                  type="text"
                  className={styles.input}
                  placeholder="Host name"
                  value={eventData.hostName}
                  onChange={handleInputChange}
                  required
                />
                <div className={styles.selectArrow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className={styles.textarea}
                placeholder="Enter event description"
                value={eventData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.label}>
                Date and time <span className={styles.required}>*</span>
              </label>
              <div className={styles.dateTimeGroup}>
                <input
                  id="date"
                  name="date"
                  type="date"
                  className={styles.dateInput}
                  placeholder="Select a date"
                  value={eventData.date}
                  onChange={handleInputChange}
                  required
                />
                
                <div className={styles.selectWrapper}>
                  <input
                    id="time"
                    name="time"
                    type="text"
                    className={styles.timeInput}
                    value={eventData.time}
                    onChange={handleInputChange}
                  />
                  <div className={styles.selectArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className={styles.selectWrapper}>
                  <input
                    id="period"
                    name="period"
                    type="text"
                    className={styles.periodInput}
                    value={eventData.period}
                    onChange={handleInputChange}
                  />
                  <div className={styles.selectArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className={styles.selectWrapper}>
                  <input
                    id="timeZone"
                    name="timeZone"
                    type="text"
                    className={styles.timeZoneInput}
                    value={eventData.timeZone}
                    onChange={handleInputChange}
                  />
                  <div className={styles.selectArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="duration" className={styles.label}>
                Set duration
              </label>
              <div className={styles.selectWrapper}>
                <input
                  id="duration"
                  name="duration"
                  type="text"
                  className={styles.durationInput}
                  value={eventData.duration}
                  onChange={handleInputChange}
                />
                <div className={styles.selectArrow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={styles.saveButton}
                disabled={loading}
              >
                {loading ? (
                  retryAttempt > 0 ? 
                  `Retrying (${retryAttempt}/3)...` : 
                  <LoadingSpinner />
                ) : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent; 
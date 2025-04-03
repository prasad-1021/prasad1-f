import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/AddEvent.module.css';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { createEvent } from '../services/eventService';

/**
 * AddEvent Component
 * 
 * A clean, modern UI for adding events with customizable settings
 * including topic, host, description, date, time, and duration.
 */
const AddEvent = () => {
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [eventData, setEventData] = useState({
    eventTopic: '',
    password: '',
    hostName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Guest User',
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
    
    // Validation
    if (!eventData.eventTopic.trim()) {
      errorToast('Event topic is required');
      return;
    }
    
    if (!eventData.date) {
      errorToast('Date is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format data for API
      const formattedData = {
        title: eventData.eventTopic.trim(),
        password: eventData.password,
        host: eventData.hostName.trim(),
        description: eventData.description.trim(),
        date: eventData.date,
        timeRange: `${eventData.time} ${eventData.period}`,
        timeZone: eventData.timeZone,
        duration: eventData.duration,
        type: 'One-on-one',
        enabled: true
      };
      
      // Call API to create event
      await createEvent(formattedData);
      
      successToast('Event created successfully!');
      
      // Redirect to events page
      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      errorToast(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  return (
    <div className={styles.addEventPage}>
      <div className={styles.mainContent}>
        <h1 className={styles.title}>Create Event</h1>
        <p className={styles.subtitle}>Create events to share for people to book on your calendar. New</p>
        
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Add Event</h2>
          </div>
          
          <div className={styles.divider}></div>
          
          <form onSubmit={handleSubmit} className={styles.eventForm}>
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
              <div className={styles.selectBox}>
                <div className={styles.selectValue}>
                  {eventData.hostName}
                </div>
                <div className={styles.selectIcon}>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Desciption
              </label>
              <textarea
                id="description"
                name="description"
                className={styles.textarea}
                placeholder="Add a description for your event"
                value={eventData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Date and time <span className={styles.required}>*</span>
              </label>
              <div className={styles.dateTimeGroup}>
                <input
                  type="text"
                  name="date"
                  className={styles.dateInput}
                  placeholder="dd/mm/yy"
                  value={eventData.date}
                  onChange={handleInputChange}
                  required
                />
                
                <div className={styles.timeSelectBox}>
                  <div className={styles.selectValue}>
                    {eventData.time}
                  </div>
                  <div className={styles.selectIcon}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className={styles.timeSelectBox}>
                  <div className={styles.selectValue}>
                    {eventData.period}
                  </div>
                  <div className={styles.selectIcon}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className={styles.timeSelectBox}>
                  <div className={styles.selectValue}>
                    {eventData.timeZone}
                  </div>
                  <div className={styles.selectIcon}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Set duration
              </label>
              <div className={styles.durationSelectBox}>
                <div className={styles.selectValue}>
                  {eventData.duration}
                </div>
                <div className={styles.selectIcon}>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEvent; 
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/EventTypes.module.css';
import { LogoSVG } from '../assets/ImagePlaceholders.jsx';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import frameBg from '../assets/Frame.png';
import { 
  getEvents, 
  deleteEvent, 
  toggleEventActive, 
  getEventLink,
  getUserCreatedEvents
} from '../services/eventService';
import LoadingSpinner from './LoadingSpinner';

/**
 * EventTypes Component
 * 
 * Displays a list of event types that users can create and manage.
 * Includes functionality for toggling event status, copying event links,
 * and deleting events.
 */
const EventTypes = () => {
  const navigate = useNavigate();
  // Access toast notifications
  const { successToast, errorToast } = useToast();
  // Access auth context
  const { user } = useAuth();
  
  // State variables
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('EventTypes component: Fetching user-created events');
        // Fetch events created by the current user
        const response = await getUserCreatedEvents();
        console.log('EventTypes component: Received response:', response);
        
        // Ensure all events have the required fields
        const normalizedEvents = (Array.isArray(response) ? response : (response?.data || [])).map(event => ({
          ...event,
          meetingLink: event.meetingLink || '',
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
        
        console.log('EventTypes component: Normalized events:', normalizedEvents);
        setEventTypes(normalizedEvents);
        // Store events in localStorage for future use
        localStorage.setItem('userEvents', JSON.stringify(normalizedEvents));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again.');
        
        // Try to load from localStorage as fallback
        try {
          const storedEvents = localStorage.getItem('userEvents');
          if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            console.log('EventTypes component: Loaded events from localStorage:', parsedEvents);
            setEventTypes(parsedEvents);
            setError(null); // Clear error if we successfully loaded from localStorage
          }
        } catch (localStorageErr) {
          console.error('Error loading from localStorage:', localStorageErr);
        }
        
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  /**
   * Toggle the active status of an event
   * @param {string} id - The event ID to toggle
   */
  const handleToggleEventStatus = async (id) => {
    try {
      // Find the event, checking both id and _id fields
      const event = eventTypes.find(event => event.id === id || event._id === id);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get the actual ID to use (_id takes precedence over id)
      const eventId = event._id || event.id;
      
      // We'll get the new status from the API response
      // If using isActive property, use it; otherwise use enabled as fallback
      const currentStatus = event.isActive !== undefined ? event.isActive : event.enabled;
      
      // Optimistically update UI
      const updatedEvents = eventTypes.map(e => {
        if (e.id === id || e._id === id) {
          return { 
            ...e, 
            isActive: !currentStatus,
            enabled: !currentStatus // Keep for backward compatibility
          };
        }
        return e;
      });
      
      setEventTypes(updatedEvents);
      
      // Update localStorage
      localStorage.setItem('userEvents', JSON.stringify(updatedEvents));
      
      // Call API
      const result = await toggleEventActive(eventId);
      
      // Update with actual result from API
      const finalUpdatedEvents = eventTypes.map(e => {
        if (e.id === id || e._id === id) {
          return { 
            ...e, 
            isActive: result.data.isActive,
            enabled: result.data.isActive // Keep for backward compatibility
          };
        }
        return e;
      });
      
      setEventTypes(finalUpdatedEvents);
      
      // Show success message
      successToast(`Event ${result.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error toggling event status:', err);
      // Revert UI change if there's an error
      errorToast(err.message || 'Failed to update event status');
      
      // Try to reload events
      try {
        const localStorageEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
        setEventTypes(localStorageEvents);
      } catch (reloadErr) {
        console.error('Error reloading events:', reloadErr);
      }
    }
  };

  /**
   * Handle copying an event link to clipboard
   * @param {string} id - The event ID to copy
   */
  const handleCopyEvent = async (id) => {
    try {
      const event = eventTypes.find(event => event.id === id);
      
      // Create a shareable link
      const baseUrl = window.location.origin;
      const shareableLink = `${baseUrl}/book/${id}`;
      
      // Copy link to clipboard
      await navigator.clipboard.writeText(shareableLink);
      
      successToast(`${event.title} link copied to clipboard`);
    } catch (err) {
      errorToast(err.message || 'Failed to copy event link');
    }
  };

  /**
   * Handle deleting an event
   * @param {string} id - The event ID to delete
   */
  const handleDeleteEvent = async (id) => {
    try {
      const event = eventTypes.find(event => event.id === id);
      
      // Optimistically update UI
      const filteredEvents = eventTypes.filter(event => event.id !== id);
      setEventTypes(filteredEvents);
      
      // Update localStorage
      localStorage.setItem('userEvents', JSON.stringify(filteredEvents));
      
      // Try to delete from API as well
      try {
        await deleteEvent(id);
      } catch (apiErr) {
        console.log('API delete failed, but localStorage was updated:', apiErr);
      }
      
      successToast(`${event.title} deleted successfully`);
    } catch (err) {
      // Reload events if there's an error
      try {
        const localStorageEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
        setEventTypes(localStorageEvents);
      } catch (fetchErr) {
        console.error('Error reloading events:', fetchErr);
      }
      
      errorToast(err.message || 'Failed to delete event');
    }
  };

  /**
   * Handle editing an event
   * @param {string} id - The event ID to edit
   */
  const handleEditEvent = (id) => {
    // Find the event to edit
    const eventToEdit = eventTypes.find(event => event.id === id || event._id === id);
    if (!eventToEdit) {
      errorToast('Event not found');
      return;
    }
    
    // Get the correct ID to use
    const eventId = eventToEdit._id || eventToEdit.id;
    console.log('Editing event with ID:', eventId);
    
    // Navigate to edit page with state
    navigate('/create-event', { state: { eventId } });
  };

  /**
   * Handle adding a new event
   */
  const handleAddNewEvent = () => {
    navigate('/create-event');
  };

  /**
   * Format date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  /**
   * Format time string for display
   * @param {string} timeString - Time string
   * @returns {string} Formatted time range
   */
  const getTimeDisplay = (event) => {
    // If timeRange is already set, use it
    if (event.timeRange) return event.timeRange;
    
    // Format 24-hour times to 12-hour format with AM/PM
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      
      // If already in 12-hour format with AM/PM, return as is
      if (/\d+:\d+\s*(AM|PM)/i.test(timeStr)) {
        return timeStr;
      }
      
      // If in 24-hour format (HH:MM), convert to 12-hour
      const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = hours >= 12 ? 'PM' : 'AM';
        
        // Convert hours to 12-hour format
        if (hours > 12) {
          hours -= 12;
        } else if (hours === 0) {
          hours = 12;
        }
        
        return `${hours}:${minutes} ${period}`;
      }
      
      return timeStr; // Return original if can't parse
    };
    
    // Format start and end times
    const startTime = formatTime(event.startTime);
    const endTime = formatTime(event.endTime);
    
    // Return formatted time range
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    
    return '1:30 PM - 2:30 PM'; // Default fallback
  };

  /**
   * Get duration text for display
   * @param {Object} event - Event object
   * @returns {string} Duration text
   */
  const getDurationText = (event) => {
    const duration = event.duration;
    if (!duration) return '1hr';
    
    // If it's a number, assume it's minutes
    if (typeof duration === 'number') {
      // Convert to hours and minutes
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      
      if (hours === 0) {
        return `${minutes}min`;
      } else if (minutes === 0) {
        return `${hours}hr`;
      } else {
        return `${hours}hr ${minutes}min`;
      }
    }
    
    // If it's a string, process it
    if (typeof duration === 'string') {
      // If it looks like seconds (e.g., "1800"), convert to minutes
      if (/^\d+$/.test(duration) && parseInt(duration) > 100) {
        const minutes = Math.floor(parseInt(duration) / 60);
        return `${minutes}min`;
      }
      
      // If it includes 'min' or 'hour', use as is
      if (duration.includes('min') || duration.includes('hour')) {
        return duration;
      }
      
      // Try to extract a number
      const match = duration.match(/\d+/);
      if (match) {
        return `${match[0]}min`;
      }
    }
    
    return '1hr'; // Default fallback
  };

  /**
   * Get type text for display
   * @param {Object} event - Event object
   * @returns {string} Type text
   */
  const getTypeText = (event) => {
    return event.type || 'Group meeting';
  };

  // Show loading spinner while fetching events
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error message if loading fails
  if (error && !eventTypes.length) {
    return (
      <div className={styles.errorContainer}>
        <h2>Failed to load events</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      {/* Header with Title and Add Button */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Event Types</h1>
          <p className={styles.subtitle}>Create events to share for people to book on your calendar.</p>
        </div>
        <button className={styles.addEventButton} onClick={handleAddNewEvent}>
          <svg className={styles.plusIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Add New Event</span>
        </button>
      </header>

      {/* Empty state if no events */}
      {eventTypes.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#676767" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V6M8 2V6M3 10H21M12 14V18M8 16H16" stroke="#676767" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className={styles.emptyStateTitle}>No events yet</h2>
          <p className={styles.emptyStateText}>Create your first event to get started</p>
          <button className={styles.emptyStateButton} onClick={handleAddNewEvent}>
            Create Event
          </button>
        </div>
      )}

      {/* Event Cards Grid */}
      {eventTypes.length > 0 && (
        <div className={styles.eventCardsContainer}>
          {eventTypes.map(event => (
            <div key={event.id} className={styles.eventCard}>
              {/* Colored header stripe */}
              <div 
                className={styles.eventCardHeader} 
                style={{ background: event.bannerColor || '#1877F2' }}
              ></div>
              
              <div className={styles.eventCardContent}>
                {/* Event Title and Edit Button */}
                <div className={styles.eventCardTitleRow}>
                  <h3 className={styles.eventCardTitle}>{event.title}</h3>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleEditEvent(event.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#676B5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#676B5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Event Details */}
                <div className={styles.eventCardDetails}>
                  <p className={styles.dateText}>{formatDate(event.createdAt)}</p>
                  <p className={styles.timeText}>{getTimeDisplay(event)}</p>
                  <p className={styles.durationText}>
                    <span>{getDurationText(event)},</span> <span>{getTypeText(event)}</span>
                  </p>
                </div>

                {/* Meeting Link */}
                {event.meetingLink && (
                  <p className={styles.meetingLinkText}>
                    <span>Meeting Link:</span> 
                    <a 
                      href={event.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.meetingLink}
                    >
                      {new URL(event.meetingLink).hostname}
                    </a>
                  </p>
                )}

                {/* Participants Count */}
                {event.participants && event.participants.length > 0 && (
                  <p className={styles.participantsText}>
                    <span>Participants:</span> {event.participants.length}
                  </p>
                )}

                {/* Card Footer with Actions */}
                <div className={styles.eventCardFooter}>
                  <button 
                    className={styles.copyButton} 
                    onClick={() => handleCopyEvent(event.id)}
                    aria-label="Copy event link"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="8" y="8" width="12" height="12" rx="2" stroke="#676B5F" strokeWidth="1.5"/>
                      <path d="M16 8V6C16 4.89543 15.1046 4 14 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8" stroke="#676B5F" strokeWidth="1.5"/>
                    </svg>
                  </button>
                  
                  <button 
                    className={styles.deleteButton} 
                    onClick={() => handleDeleteEvent(event.id)}
                    aria-label="Delete event"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="#676B5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#676B5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  {/* Toggle Switch */}
                  <div 
                    className={`${styles.toggleContainer} ${(event.isActive || event.enabled) ? styles.enabled : ''}`} 
                    onClick={() => handleToggleEventStatus(event.id)}
                    role="switch"
                    aria-checked={(event.isActive || event.enabled) !== false}
                    tabIndex={0}
                  >
                    <div className={styles.toggleButton}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventTypes; 
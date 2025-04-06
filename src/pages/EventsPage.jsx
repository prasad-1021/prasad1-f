import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EventCard from '../components/EventCard';
import styles from './EventsPage.module.css';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { errorToast } = useToast();
  const navigate = useNavigate();
  
  // Load events on mount and when refreshEvents is called
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEvents();
      console.log('Retrieved events:', response);
      
      // If response is an array, use it directly, otherwise use data property
      const eventsData = Array.isArray(response) ? response : response.data;
      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
      errorToast(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };
  
  // Check authentication and load events
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin', { replace: true });
      return;
    }
    
    loadEvents();
  }, [isAuthenticated, navigate]);
  
  // Handle create event button click
  const handleCreateEvent = () => {
    navigate('/create-event');
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Events</h1>
        <button
          className={styles.createButton}
          onClick={handleCreateEvent}
        >
          Create New Event
        </button>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : error ? (
        <div className={styles.error}>
          {error}
          <button onClick={loadEvents} className={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You don't have any events yet.</p>
          <button onClick={handleCreateEvent} className={styles.createButtonEmpty}>
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className={styles.eventGrid}>
          {events.map(event => (
            <EventCard
              key={event._id || event.id}
              event={event}
              onUpdate={loadEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage; 
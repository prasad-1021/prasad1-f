import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCreatedEvents, toggleEventActive, duplicateEvent, deleteEvent } from '../services/eventService';
import { useToast } from '../contexts/ToastContext';
import EventCard from '../components/EventCard';
import styles from '../styles/EventTypesPage.module.css';

const EventTypesPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();

  // Load all events created by the current user
  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await getUserCreatedEvents();
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      errorToast('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Handle toggle event active status
  const handleToggle = async (eventId) => {
    try {
      console.log(`Attempting to toggle event with ID: ${eventId}`);
      
      // Find the event in our state to get current status
      const eventToToggle = events.find(event => event._id === eventId);
      console.log('Event found in UI state:', eventToToggle);
      
      if (!eventToToggle) {
        throw new Error('Event not found in UI state');
      }
      
      // Toggle the active status
      const result = await toggleEventActive(eventId);
      console.log('Toggle result:', result);
      
      successToast(`Event ${result.data.isActive ? 'activated' : 'deactivated'} successfully`);
      
      // Refresh the events list
      loadEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
      errorToast('Failed to toggle event status');
    }
  };

  // Handle duplicate event
  const handleDuplicate = async (eventId) => {
    try {
      await duplicateEvent(eventId);
      successToast('Event duplicated successfully');
      loadEvents();
    } catch (error) {
      console.error('Error duplicating event:', error);
      errorToast('Failed to duplicate event');
    }
  };

  // Handle delete event
  const handleDelete = async (eventId) => {
    try {
      await deleteEvent(eventId);
      successToast('Event deleted successfully');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      errorToast('Failed to delete event');
    }
  };

  // Create new event
  const handleCreateEvent = () => {
    navigate('/create-event');
  };

  return (
    <div className={styles.eventTypesPage}>
      <header className={styles.header}>
        <h1>Event Types</h1>
        <button 
          className={styles.createButton}
          onClick={handleCreateEvent}
        >
          Create Event Type +
        </button>
      </header>

      <div className={styles.eventList}>
        {loading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : events.length > 0 ? (
          events.map(event => (
            <EventCard 
              key={event._id} 
              event={event}
              onToggle={() => handleToggle(event._id)}
              onDuplicate={() => handleDuplicate(event._id)}
              onDelete={() => handleDelete(event._id)}
              onUpdate={loadEvents}
            />
          ))
        ) : (
          <div className={styles.noEvents}>
            <p>You don't have any event types yet.</p>
            <button 
              className={styles.createFirstButton}
              onClick={handleCreateEvent}
            >
              Create your first event type
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTypesPage; 
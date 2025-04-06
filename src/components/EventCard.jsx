import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  toggleEventActive, 
  duplicateEvent, 
  deleteEvent 
} from '../services/eventService';
import { useToast } from '../contexts/ToastContext';
import styles from './EventCard.module.css';

const EventCard = ({ event, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  
  // Handle toggle active status
  const handleToggleActive = async (e) => {
    e.stopPropagation();
    
    try {
      setLoading(true);
      
      const result = await toggleEventActive(event._id || event.id);
      console.log('Toggle result:', result);
      
      successToast(`Event ${result.data.isActive ? 'activated' : 'deactivated'} successfully`);
      
      // Refresh the parent component
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling event status:', error);
      errorToast(error.message || 'Failed to toggle event status');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle duplicate event
  const handleDuplicate = async (e) => {
    e.stopPropagation();
    
    try {
      setLoading(true);
      
      const result = await duplicateEvent(event._id || event.id);
      console.log('Duplicate result:', result);
      
      successToast('Event duplicated successfully');
      
      // Refresh the parent component
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error duplicating event:', error);
      errorToast(error.message || 'Failed to duplicate event');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit event
  const handleEdit = (e) => {
    e.stopPropagation();
    
    // Get the event ID, prioritizing _id over id
    const eventId = event._id || event.id;
    console.log('Editing event with ID:', eventId);
    
    // Navigate to edit page with state
    navigate('/create-event', { state: { eventId } });
  };
  
  // Handle delete event
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteEvent(event._id || event.id);
      
      successToast('Event deleted successfully');
      
      // Refresh the parent component
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting event:', error);
      errorToast(error.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatEventDate = (dateStr) => {
    try {
      // Try to parse various date formats
      let date;
      if (typeof dateStr === 'string') {
        if (dateStr.includes('/')) {
          // Handle DD/MM/YY format
          const [day, month, year] = dateStr.split('/').map(Number);
          date = new Date(2000 + year, month - 1, day); // Assuming 2000+ for 2-digit year
        } else {
          // Try standard date parsing
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }

      if (!isNaN(date.getTime())) {
        // Format day name and date
        const dayName = format(date, 'EEEE');
        const dayNum = format(date, 'dd');
        // Get month name in lowercase
        const monthName = format(date, 'MMM').toLowerCase();
        
        return `${dayName}, ${dayNum} ${monthName}`;
      }
      return dateStr;
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return dateStr;
    }
  };
  
  // Format time range for display
  const formatTimeRange = (start, end) => {
    console.log('Event time values:', { start, end, event });
    
    // Try to extract from timeRange if start/end are missing but timeRange exists
    if ((!start || !end) && event.timeRange && event.timeRange !== 'No time set') {
      const timeRangeParts = event.timeRange.split('-').map(part => part.trim());
      if (timeRangeParts.length === 2) {
        console.log('Extracted time from timeRange:', timeRangeParts);
        const [extractedStart, extractedEnd] = timeRangeParts;
        
        if (!start) start = extractedStart;
        if (!end) end = extractedEnd;
      }
    }

    // If we still don't have a start time but have other time-related fields, construct it
    if (!start && event.time && event.period) {
      start = `${event.time} ${event.period}`;
      console.log('Constructed start time from time and period:', start);
    }

    // If we have a start time but no end time, calculate it from duration
    if (start && !end && event.duration) {
      console.log('Calculating end time based on start time and duration:', { start, duration: event.duration });
      try {
        // Parse start time
        const startTime = start.trim();
        const [timeStr, period] = startTime.split(' ');
        let [hours, minutes] = timeStr.split(':').map(Number);
        
        // Convert to 24-hour format for calculations
        if (period && period.toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        } else if (period && period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        
        // Parse duration to minutes
        const durationString = typeof event.duration === 'string' ? event.duration : String(event.duration || '1 hour');
        const durationMinutes = parseInt(durationString.match(/\d+/)[0], 10) || 60;
        
        // Calculate end time
        const endDate = new Date();
        endDate.setHours(hours, minutes + durationMinutes);
        
        // Format end time back to 12-hour format
        let endHour = endDate.getHours();
        const endMinutes = endDate.getMinutes();
        const endPeriod = endHour >= 12 ? 'PM' : 'AM';
        
        if (endHour > 12) {
          endHour -= 12;
        } else if (endHour === 0) {
          endHour = 12;
        }
        
        end = `${endHour}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
        console.log('Calculated end time:', end);
      } catch (error) {
        console.error('Error calculating end time:', error);
      }
    }
    
    // If we still don't have times, use defaults for a better user experience
    if (!start && !end) {
      // Default to a reasonable time instead of "No time set"
      start = "10:00 AM";
      end = "11:00 AM";
      console.log('Using default times:', { start, end });
    } else if (!start) {
      start = end.replace(/\d+:\d+/, "9:00");
      console.log('Created default start time:', start);
    } else if (!end) {
      // Last resort if we couldn't calculate end time
      const match = start.match(/(\d+):/);
      const hour = match ? parseInt(match[1], 10) : 10;
      const nextHour = hour >= 12 ? 1 : hour + 1;
      const period = start.includes('PM') ? 'PM' : 'AM';
      end = `${nextHour}:00 ${period}`;
      console.log('Created fallback end time:', end);
    }
    
    // Format to show as "10:00 - 11:00 AM" with AM/PM only once if same period
    try {
      // Extract components
      const startMatch = start.match(/(\d+:\d+)\s*([AP]M)?/i);
      const endMatch = end.match(/(\d+:\d+)\s*([AP]M)?/i);
      
      if (startMatch && endMatch) {
        const startTime = startMatch[1];
        const startPeriod = (startMatch[2] || '').toUpperCase();
        const endTime = endMatch[1];
        const endPeriod = (endMatch[2] || '').toUpperCase();
        
        // If periods are the same, show only once at the end
        if (startPeriod && endPeriod && startPeriod === endPeriod) {
          return `${startTime} - ${endTime} ${startPeriod}`;
        }
        
        // If periods differ or one is missing, show full format
        const formattedStart = startPeriod ? `${startTime} ${startPeriod}` : startTime;
        const formattedEnd = endPeriod ? `${endTime} ${endPeriod}` : endTime;
        return `${formattedStart} - ${formattedEnd}`;
      }
      
      // Fallback to original format if regex matching fails
      return `${start} - ${end}`;
    } catch (error) {
      console.error('Error formatting time range:', error);
      return `${start} - ${end}`;
    }
  };
  
  // Get the banner background color
  const getBannerColor = () => {
    if (event.bannerSettings && event.bannerSettings.backgroundColor) {
      return event.bannerSettings.backgroundColor;
    }
    return event.bannerColor || '#3498db';
  };
  
  // Handle navigation to event page
  const handleViewEvent = () => {
    navigate(`/event/${event._id || event.id}`);
  };
  
  // Format duration properly for display
  const formatDuration = (duration) => {
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
      
      // Otherwise, use the existing duration string
      return duration.match(/\d+/) ? `${duration.match(/\d+/)[0]}hr` : duration;
    }
    
    return '1hr'; // Default
  };
  
  return (
    <div className={styles.card}>
      <div 
        className={styles.banner} 
        style={{ backgroundColor: getBannerColor() }}
      >
        <h3 className={styles.title}>{event.title || 'Meeting'}</h3>
        <button 
          className={styles.editIcon}
          onClick={handleEdit}
          disabled={loading}
        >
          ✏️
        </button>
      </div>
      
      <div className={styles.content} onClick={handleViewEvent}>
        <div className={styles.details}>
          <div className={styles.date}>
            {formatEventDate(event.date)}
          </div>
          <div className={styles.time}>
            {formatTimeRange(event.startTime, event.endTime)}
          </div>
          <div className={styles.description}>
            {event.duration ? (
              <>
                {formatDuration(event.duration)}
                {', '}
              </>
            ) : (
              <>1hr, </>
            )}
            <span className={styles.eventType}>
              {event.type || 'Meeting'}
            </span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={event.isActive}
              onChange={handleToggleActive}
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
          
          <div className={styles.actionIcons}>
            <button 
              className={styles.actionButton}
              onClick={handleDuplicate}
              disabled={loading}
              title="Duplicate event"
            >
              <span className={styles.icon}>📋</span>
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={handleDelete}
              disabled={loading}
              title="Delete event"
            >
              <span className={styles.icon}>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 
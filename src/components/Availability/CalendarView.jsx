import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { format, addDays, startOfWeek } from 'date-fns';
import styles from './CalendarView.module.css';
import { getAvailability } from '../../services/availabilityService';
import { availabilityToEvents, getStatusColor } from './utils';
import { getEvents } from '../../services/eventService';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { BiSearch } from 'react-icons/bi';

// Define valid view types
const Views = {
  MONTH: 'dayGridMonth',
  WEEK: 'timeGridWeek',
  DAY: 'timeGridDay',
  AGENDA: 'listWeek'
};

// Function to convert time string to date object
const timeStringToDate = (dateStr, timeStr) => {
  if (!timeStr || !dateStr) return null;

  const date = new Date(dateStr);
  
  // Handle different time formats
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  if (timeStr.includes(' ')) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = [0, 0];
    
    if (time.includes(':')) {
      [hours, minutes] = time.split(':').map(Number);
    } else {
      hours = parseInt(time, 10);
      minutes = 0;
    }
    
    // Convert 12-hour to 24-hour format
    if (period && period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (period && period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  // Default
  return date;
};

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        // Fetch events
        const eventsResponse = await getEvents();
        const fetchedEvents = eventsResponse.data || [];
        
        // Convert events to calendar format
        const calendarEvents = fetchedEvents.map(event => ({
          id: event._id || event.id,
          title: event.title,
          start: timeStringToDate(event.date, event.startTime),
          end: timeStringToDate(event.date, event.endTime),
          color: '#0EA5E9',  // Blue for events
          type: 'event'
        })).filter(event => event.start && event.end); // Remove events with invalid dates
        
        setEvents(calendarEvents);
        
        // Fetch availability
        const availabilityResponse = await getAvailability();
        const userAvailability = availabilityResponse.data || [];
        
        // Create availability events (for the current week)
        const availabilityEvents = [];
        const startDate = startOfWeek(currentDate);
        
        userAvailability.forEach(dayData => {
          // Skip unavailable days
          if (!dayData.isAvailable) return;
          
          // Match day name to day of week number
          const dayMap = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
          };
          const dayOfWeek = dayMap[dayData.day];
          
          if (dayOfWeek === undefined) return;
          
          // Get date for this weekday
          const date = addDays(startDate, dayOfWeek);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Process each time slot
          if (dayData.slots && dayData.slots.length > 0) {
            dayData.slots.forEach(slot => {
              // Skip empty slots
              if (!slot.startTime || !slot.endTime) return;
              
              availabilityEvents.push({
                id: `avail-${dayData.day}-${slot.startTime}-${slot.endTime}`,
                title: `Available: ${slot.startTime} - ${slot.endTime}`,
                start: timeStringToDate(dateStr, slot.startTime),
                end: timeStringToDate(dateStr, slot.endTime),
                color: '#DCFCE7',  // Light green for availability
                type: 'availability'
              });
            });
          } else {
            // If day is available but no slots specified, mark entire day
            availabilityEvents.push({
              id: `avail-all-day-${dayData.day}`,
              title: 'Available All Day',
              start: new Date(date.setHours(0, 0, 0, 0)),
              end: new Date(date.setHours(23, 59, 59, 999)),
              color: '#DCFCE7',  // Light green for availability
              type: 'availability'
            });
          }
        });
        
        setAvailabilitySlots(availabilityEvents);
        
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendarData();
  }, [currentDate]);

  // Ensure only valid views are set
  const handleViewChange = (newView) => {
    // Only set valid views from react-big-calendar
    if ([Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].includes(newView)) {
      setView(newView);
    }
  };

  // Custom header for the calendar
  const CustomHeader = ({ label, onNavigate }) => (
    <div className={styles.calendarHeader}>
      <div className={styles.navigationControls}>
        <button className={styles.navButton} onClick={() => onNavigate('PREV')}>
          <HiChevronLeft />
        </button>
        <span className={styles.dateLabel}>{label}</span>
        <button className={styles.navButton} onClick={() => onNavigate('NEXT')}>
          <HiChevronRight />
        </button>
      </div>
      
      <div className={styles.viewControls}>
        <button 
          className={`${styles.viewButton} ${view === Views.DAY ? styles.activeView : ''}`}
          onClick={() => handleViewChange(Views.DAY)}
        >
          Day
        </button>
        <button 
          className={`${styles.viewButton} ${view === Views.WEEK ? styles.activeView : ''}`}
          onClick={() => handleViewChange(Views.WEEK)}
        >
          Week
        </button>
        <button 
          className={`${styles.viewButton} ${view === Views.MONTH ? styles.activeView : ''}`}
          onClick={() => handleViewChange(Views.MONTH)}
        >
          Month
        </button>
      </div>
      
      <div className={styles.searchContainer}>
        <BiSearch className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>
    </div>
  );

  // Custom event component to apply colors
  const EventComponent = ({ event }) => (
    <div 
      className={`${styles.calendarEvent} ${event.type === 'availability' ? styles.availabilityEvent : ''}`}
      style={{ 
        backgroundColor: event.color || '#0EA5E9',
        opacity: event.type === 'availability' ? 0.7 : 1
      }}
    >
      <div 
        className={styles.eventBar} 
        style={{ 
          backgroundColor: event.type === 'availability' ? '#10B981' : '#0EA5E9'
        }}
      ></div>
      <div className={styles.eventContent}>
        {event.type !== 'availability' && (
          <div className={styles.eventTime}>
            {event.start && format(event.start, 'h:mm a')}
          </div>
        )}
        <div className={styles.eventTitle}>
          {event.type === 'availability' 
            ? 'Available' 
            : event.title}
        </div>
      </div>
    </div>
  );

  // All calendar items - events + availability slots
  const allCalendarItems = [...events, ...availabilitySlots].filter(item => {
    // Filter based on search query if present
    if (!searchQuery) return true;
    return item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.calendarContainer}>
      {loading && <div className={styles.loadingOverlay}>Loading calendar data...</div>}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        initialDate={currentDate}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        events={allCalendarItems}
        eventContent={(arg) => <EventComponent event={arg.event} />}
        eventClick={(info) => {
          // Handle event click
        }}
        dateClick={(info) => {
          // Handle date click
        }}
        dayCellContent={(arg) => {
          const today = new Date();
          if (arg.date.getDate() === today.getDate() && 
              arg.date.getMonth() === today.getMonth() && 
              arg.date.getFullYear() === today.getFullYear()) {
            return (
              <div className={styles.currentDayCell}>
                {arg.dayNumberText}
              </div>
            );
          }
          if (arg.date.getDay() === 0 || arg.date.getDay() === 6) {
            return (
              <div className={styles.weekendDayCell}>
                {arg.dayNumberText}
              </div>
            );
          }
          return arg.dayNumberText;
        }}
      />
    </div>
  );
};

export default CalendarView; 
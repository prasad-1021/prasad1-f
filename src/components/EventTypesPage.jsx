import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil } from 'react-icons/hi';
import { CgCopy } from 'react-icons/cg';
import { FaTrashAlt } from 'react-icons/fa';
import styles from './EventTypesPage.module.css';
import { useToast } from '../contexts/ToastContext';
import { getUserCreatedEvents, toggleEventActive, getEventLink, deleteEvent } from '../services/eventService';
import LoadingSpinner from './LoadingSpinner';

const EventTypesPage = () => {
    const navigate = useNavigate();
    const { successToast, errorToast } = useToast();
    const [eventTypes, setEventTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Format duration to human-readable format (15 min, 1 hr, etc.)
    const formatDuration = (duration) => {
        if (!duration) return '1 hr'; // Default fallback
        
        // Parse the duration value
        let durationMinutes = 0;
        
        // First handle numeric value (likely minutes or directly stored durationMinutes)
        if (typeof duration === 'number') {
            durationMinutes = duration;
        } else if (typeof duration === 'string') {
            // Handle explicit minute format
            if (duration.includes('min')) {
                const match = duration.match(/(\d+)/);
                if (match) {
                    durationMinutes = parseInt(match[1], 10);
                }
            } 
            // Handle hour format (1 hour, 1.5 hours)
            else if (duration.includes('hour') || duration.includes('hr')) {
                const match = duration.match(/([\d\.]+)/);
                if (match) {
                    durationMinutes = Math.floor(parseFloat(match[1]) * 60);
                }
            } 
            // Just a number as string - parse it
            else if (!isNaN(parseInt(duration, 10))) {
                const value = parseInt(duration, 10);
                // If value ≤ 180, treat as minutes, otherwise treat as seconds
                if (value <= 180) {
                    durationMinutes = value;
                } else if (value <= 10800) { // 3hrs in seconds
                    durationMinutes = Math.floor(value / 60);
                } else {
                    // Extremely large values are likely milliseconds, convert appropriately
                    durationMinutes = Math.floor(value / (1000 * 60));
                }
            }
        }
        
        // Sanity check - if duration is unreasonable, use default
        if (durationMinutes <= 0 || durationMinutes > 1440) { // Max 24 hours
            durationMinutes = 60; // Default to 1 hour
        }
        
        // Format the duration appropriately
        if (durationMinutes < 60) {
            return `${durationMinutes} min`;
        } else {
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            
            if (minutes === 0) {
                return hours === 1 ? '1 hr' : `${hours} hr`;
            } else {
                // For non-zero minutes, use decimal format for better readability
                const decimalHours = (hours + (minutes / 60)).toFixed(1);
                return `${decimalHours} hr`;
            }
        }
    };

    // Utility function to format time range
    const formatTimeRange = (event) => {
        console.log('Formatting time for event:', JSON.stringify(event, null, 2));
        
        // Extract start and end times
        let start = event.startTime;
        let end = event.endTime;
        
        console.log('Initial times:', { start, end });
        
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

        console.log('After timeRange extraction:', { start, end });

        // If we still don't have a start time but have other time-related fields, construct it
        if (!start && event.time && event.period) {
            start = `${event.time} ${event.period}`;
            console.log('Constructed start time from time and period:', start);
        }

        console.log('Before end time calculation:', { start, end, duration: event.duration });

        // If we have a start time but no end time, calculate it from duration
        if (start && !end && event.duration) {
            console.log('Calculating end time based on start time and duration:', { start, duration: event.duration });
            try {
                // Parse start time
                const startTime = start.trim();
                let parts = startTime.split(' ');
                
                // Handle formats like "10:00 AM" or just "10:00" (assuming AM)
                let timeStr, period;
                if (parts.length >= 2) {
                    timeStr = parts[0];
                    period = parts[1].toUpperCase();
                } else {
                    timeStr = parts[0];
                    // Check if time has AM/PM without space (e.g., "10:00AM")
                    if (timeStr.toUpperCase().includes('AM')) {
                        timeStr = timeStr.replace(/AM/i, '');
                        period = 'AM';
                    } else if (timeStr.toUpperCase().includes('PM')) {
                        timeStr = timeStr.replace(/PM/i, '');
                        period = 'PM';
                    } else {
                        period = 'AM'; // Default to AM if not specified
                    }
                }
                
                // Handle special case where time might be like "12" (meaning 12:00)
                if (!timeStr.includes(':')) {
                    timeStr = `${timeStr}:00`;
                }
                
                let [hours, minutes] = timeStr.split(':').map(Number);
                
                // Ensure valid values
                if (isNaN(hours) || isNaN(minutes)) {
                    throw new Error('Invalid time format');
                }
                
                console.log('Parsed start time:', { hours, minutes, period });
                
                // Convert to 24-hour format for calculations
                if (period === 'PM' && hours < 12) {
                    hours += 12;
                    console.log('Converted PM hours to 24-hour format:', hours);
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                    console.log('Converted 12 AM to 0 hours');
                }
                
                // Parse duration to minutes
                const durationString = typeof event.duration === 'string' ? event.duration : String(event.duration || '1 hour');
                console.log('Duration string:', durationString);
                
                // Try to match different duration formats (15 min, 30min, 1 hour, 1.5 hours)
                let durationMinutes = 60; // Default to 60 minutes
                
                if (durationString.includes('min')) {
                    // Format: "15 min" or "15min"
                    const match = durationString.match(/(\d+)\s*min/i);
                    if (match) {
                        durationMinutes = parseInt(match[1], 10);
                        console.log('Parsed minutes format:', durationMinutes);
                    }
                } else if (durationString.match(/^\d+$/)) {
                    // Just a number like "15" - assume minutes if ≤ 60, hours otherwise
                    const value = parseInt(durationString, 10);
                    durationMinutes = value <= 60 ? value : value * 60;
                    console.log('Parsed numeric format:', durationMinutes);
                } else if (durationString.includes('hour')) {
                    // Format: "1 hour" or "1.5 hours"
                    const match = durationString.match(/([\d\.]+)\s*hours?/i);
                    if (match) {
                        durationMinutes = parseFloat(match[1]) * 60;
                        console.log('Parsed hours format:', durationMinutes);
                    }
                }
                
                console.log('Final calculated duration minutes:', durationMinutes);
                
                // Calculate end time
                const totalMinutes = hours * 60 + minutes;
                const endTotalMinutes = totalMinutes + durationMinutes;
                
                const endHours = Math.floor(endTotalMinutes / 60) % 24;
                const endMinutes = Math.floor(endTotalMinutes % 60);
                
                // Convert back to 12-hour format
                let displayEndHours;
                let endPeriod;
                
                if (endHours === 0) {
                    displayEndHours = 12;
                    endPeriod = 'AM';
                } else if (endHours < 12) {
                    displayEndHours = endHours;
                    endPeriod = 'AM';
                } else if (endHours === 12) {
                    displayEndHours = 12;
                    endPeriod = 'PM';
                } else {
                    displayEndHours = endHours - 12;
                    endPeriod = 'PM';
                }
                
                // Format the end time
                const formattedEndMinutes = endMinutes.toString().padStart(2, '0');
                end = `${displayEndHours}:${formattedEndMinutes} ${endPeriod}`;
                console.log('Calculated end time:', end);
            } catch (error) {
                console.error('Error calculating end time:', error);
            }
        }
        
        console.log('After end time calculation:', { start, end });
        
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
        
        // Ensure both start and end times have consistent AM/PM format
        const ensureAmPmFormat = (timeStr) => {
            if (!timeStr) return timeStr;
            
            // Handle case where AM/PM might be missing
            if (!timeStr.toUpperCase().includes('AM') && !timeStr.toUpperCase().includes('PM')) {
                return timeStr + ' AM'; // Default to AM if missing
            }
            
            // Standardize spacing between time and AM/PM
            return timeStr.replace(/(\d+:\d+)\s*(AM|PM|am|pm)/i, '$1 $2').toUpperCase();
        };
        
        start = ensureAmPmFormat(start);
        end = ensureAmPmFormat(end);
        
        console.log('Final formatted times:', { start, end });
        
        // Format the final output with consistent spacing
        return `${start} - ${end}`;
    };

    // Define fetchEvents with useCallback to prevent infinite loop
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching events for EventTypesPage...');
            
            // Using getUserCreatedEvents instead of getEvents
            const response = await getUserCreatedEvents();
            console.log('API response for events:', response);
            
            // Check if response is valid and has data
            if (!response || !response.success) {
                console.error('Invalid response from API:', response);
                errorToast(response?.message || 'Failed to load events');
                return;
            }
            
            // Ensure response.data exists and is an array
            if (!Array.isArray(response.data)) {
                console.error('Invalid data format from API:', response);
                errorToast('Invalid data format received from server');
                return;
            }
            
            // Process data to ensure consistent property names
            const processedEvents = response.data.map(event => ({
                ...event,
                // Ensure both isActive and enabled properties exist and are in sync
                isActive: event.isActive !== undefined ? event.isActive : event.enabled,
                enabled: event.enabled !== undefined ? event.enabled : event.isActive,
                // Ensure color property exists
                color: (event.isActive || event.enabled) ? '#1877F2' : '#676767'
            }));
            
            setEventTypes(processedEvents);
            
            // Store in localStorage for state persistence
            localStorage.setItem('userEvents', JSON.stringify(processedEvents));
            console.log('Events stored in localStorage:', processedEvents);
            
        } catch (error) {
            console.error('Error fetching events:', error);
            errorToast('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, [errorToast]);

    // Load events - first attempt to load from localStorage, then fetch from API
    useEffect(() => {
        // First try to load from localStorage for instant UI display
        try {
            const cachedEvents = localStorage.getItem('userEvents');
            if (cachedEvents) {
                const parsedEvents = JSON.parse(cachedEvents);
                console.log('Loaded events from localStorage:', parsedEvents.length);
                setEventTypes(parsedEvents);
            }
        } catch (error) {
            console.error('Error loading events from localStorage:', error);
        }
        
        // Then fetch fresh data from the API
        fetchEvents();
    }, [fetchEvents]);

    const handleToggle = async (id) => {
        try {
            setLoading(true);
            console.log('Attempting to toggle event with ID:', id);
            
            // Use _id instead of id for MongoDB documents
            const eventToToggle = eventTypes.find(event => event._id === id || event.id === id);
            console.log('Event found in UI state:', eventToToggle);
            
            if (!eventToToggle) throw new Error('Event not found in UI state');
            
            // Get the event ID, prioritizing _id (MongoDB) over id
            const eventId = eventToToggle._id || eventToToggle.id;
            
            // Optimistically update UI for smoother experience
            const optimisticEventTypes = eventTypes.map(event => {
                if (event._id === eventId || event.id === eventId) {
                    const newStatus = !(event.isActive || event.enabled);
                    return {
                        ...event,
                        isActive: newStatus,
                        enabled: newStatus, // For backwards compatibility
                        color: newStatus ? '#1877F2' : '#676767'
                    };
                }
                return event;
            });
            
            setEventTypes(optimisticEventTypes);
            localStorage.setItem('userEvents', JSON.stringify(optimisticEventTypes));
            
            // Call API to update active status
            const result = await toggleEventActive(eventId);
            console.log('Toggle API result:', result);
            
            // Update local state with actual result from API
            const updatedEventTypes = eventTypes.map(event => {
                if (event._id === eventId || event.id === eventId) {
                    return {
                        ...event,
                        isActive: result.data.isActive,
                        enabled: result.data.isActive, // For backwards compatibility
                        color: result.data.isActive ? '#1877F2' : '#676767'
                    };
                }
                return event;
            });
            
            setEventTypes(updatedEventTypes);
            
            // Update localStorage with the correct state
            localStorage.setItem('userEvents', JSON.stringify(updatedEventTypes));
            console.log('Updated events stored in localStorage');
            
            successToast(`Event ${result.data.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (err) {
            console.error('Error toggling event status:', err);
            errorToast(err.message || 'Failed to update event status');
            
            // On error, reload events to restore correct state
            fetchEvents();
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (event) => {
        try {
            // Get the correct event ID (MongoDB uses _id)
            const eventId = event._id || event.id;
            
            if (!eventId) {
                throw new Error('Event ID not found');
            }
            
            console.log('Copying link for event with ID:', eventId);
            
            // Generate a fallback URL in case the API fails
            const baseUrl = window.location.origin;
            const fallbackLink = `${baseUrl}/book/${eventId}`;
            
            try {
                // Try to get the shareable link from the API
                const linkData = await getEventLink(eventId);
                
                if (linkData && linkData.link) {
                    // Copy API-generated link to clipboard
                    await navigator.clipboard.writeText(linkData.link);
                    successToast(`Link to "${event.title}" copied to clipboard`);
                } else {
                    // If API returns empty data, use fallback link
                    await navigator.clipboard.writeText(fallbackLink);
                    successToast(`Link to "${event.title}" copied to clipboard (fallback)`);
                }
            } catch (apiError) {
                console.error('API error generating link:', apiError);
                
                // If API fails, use fallback link
                await navigator.clipboard.writeText(fallbackLink);
                successToast(`Link to "${event.title}" copied to clipboard (fallback)`);
            }
        } catch (err) {
            console.error('Error copying event link:', err);
            errorToast('Failed to copy event link');
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            
            // Find the event, allowing for both id and _id
            const eventToDelete = eventTypes.find(event => event._id === id || event.id === id);
            
            if (!eventToDelete) {
                throw new Error('Event not found');
            }
            
            // Get the correct ID to use with the API
            const eventId = eventToDelete._id || eventToDelete.id;
            console.log('Deleting event with ID:', eventId);
            
            // Call API to delete event
            await deleteEvent(eventId);
            
            // Update local state - need to filter by both possible ID fields
            setEventTypes(prevEvents => prevEvents.filter(event => 
                event.id !== id && event._id !== id
            ));
            
            successToast('Event deleted successfully');
        } catch (err) {
            console.error('Error deleting event:', err);
            errorToast(err.message || 'Failed to delete event');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewEvent = () => {
        console.log('Navigating to create event page');
        
        // Clear any existing event data in session storage
        try {
            sessionStorage.removeItem('editingEventData');
        } catch (error) {
            console.error('Error clearing session storage:', error);
        }
        
        // Navigate to create event page with clean state
        navigate('/create-event', { 
            state: { 
                fromEventTypes: true,  // Flag to indicate coming from event types page
                isNewEvent: true       // Flag to ensure we're creating a new event
            } 
        });
    };

    const handleEditEvent = (id) => {
        // Find the event, checking for both id and _id
        const eventToEdit = eventTypes.find(event => event._id === id || event.id === id);
        
        if (!eventToEdit) {
            errorToast('Event not found');
            return;
        }
        
        // Get the correct ID to use - ensure we're handling both id formats
        const eventId = eventToEdit._id || eventToEdit.id;
        
        // Log all information to help with debugging
        console.log('Editing event:', eventToEdit);
        console.log('Using event ID:', eventId);
        console.log('Original requested ID:', id);
        
        // Save event data to session storage for better persistence
        try {
            sessionStorage.setItem('editingEventData', JSON.stringify(eventToEdit));
        } catch (error) {
            console.error('Error saving event data to session:', error);
        }
        
        // Navigate to edit page with both id formats for compatibility
        navigate('/create-event', { 
            state: { 
                eventId: eventId,
                event: eventToEdit
            } 
        });
    };

    // Show loading spinner while fetching events
    if (loading && eventTypes.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className={styles.eventTypesPage}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Event Types</h1>
                    <p className={styles.description}>Create events to share for people to book on your calendar. New</p>
                </div>
                <button 
                    className={styles.addEventButton}
                    onClick={handleAddNewEvent}
                >
                    <span className={styles.plusIcon}>+</span>
                    <span>Add New Event</span>
                </button>
            </div>

            {/* Empty state if no events */}
            {eventTypes.length === 0 && !loading && (
                <div className={styles.emptyState}>
                    <p>You don't have any events yet. Click 'Add New Event' to create one.</p>
                </div>
            )}

            <div className={styles.eventCardsContainer}>
                {eventTypes.map(event => (
                    <div key={event.id} className={styles.eventCard}>
                        <div 
                            className={styles.eventCardHeader} 
                            style={{ backgroundColor: (event.isActive || event.enabled) ? '#1877F2' : '#676767' }}
                        ></div>
                        <div className={styles.eventCardContent}>
                            <div className={styles.eventCardTitleRow}>
                                <h3 className={styles.eventCardTitle}>{event.title}</h3>
                                <button 
                                    className={styles.editButton}
                                    onClick={() => handleEditEvent(event._id || event.id)}
                                >
                                    <HiOutlinePencil className={styles.editIcon} />
                                </button>
                            </div>
                            
                            <div className={styles.eventCardDetails}>
                                <p className={styles.eventDate}>{event.date || 'No date set'}</p>
                                <p className={styles.eventTime}>{formatTimeRange(event)}</p>
                                <p className={styles.eventDuration}>
                                    <span>{formatDuration(event.duration)}, </span>
                                    <span className={styles.eventType}>{event.eventType || event.type || 'Meeting'}</span>
                                </p>
                            </div>
                            
                            <div className={styles.eventCardDivider}></div>
                            
                            <div className={styles.eventCardFooter}>
                                <div 
                                    className={`${styles.toggleSwitch} ${event.isActive || event.enabled ? styles.enabled : ''}`}
                                    onClick={() => handleToggle(event._id || event.id)}
                                >
                                    <div className={styles.toggleThumb}></div>
                                </div>
                                
                                <div className={styles.actionButtons}>
                                    <button 
                                        className={styles.actionButton}
                                        onClick={() => handleCopy(event)}
                                        title="Copy meeting link"
                                    >
                                        <CgCopy />
                                    </button>
                                    <button 
                                        className={styles.actionButton}
                                        onClick={() => handleDelete(event._id || event.id)}
                                        title="Delete meeting"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventTypesPage; 
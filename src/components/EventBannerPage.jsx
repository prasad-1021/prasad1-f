import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './EventBannerPage.module.css';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, updateEvent, getEventById } from '../services/eventService';
import { checkAvailabilityConflict } from '../services/availabilityService';
import boySvg from '../assets/boy.svg';

const EventBannerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { successToast, errorToast } = useToast();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [eventId, setEventId] = useState(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/signin', { replace: true });
            return;
        }
    }, [isAuthenticated, navigate]);

    // Banner data state
    const [bannerData, setBannerData] = useState({
        title: 'Team A Meeting-1',
        backgroundColor: '#342B26',
        customColor: '#000000',
        link: '',
        emails: ''
    });
    
    const userId = user?.id || user?._id;
    
    useEffect(() => {
        // Check if we're in edit mode
        const stateIsEditMode = location.state?.isEditMode;
        const stateEventId = location.state?.eventId;
        
        if (stateIsEditMode && stateEventId) {
            setIsEditMode(true);
            setEventId(stateEventId);
            
            // Try to load the existing event data for the banner
            const loadEventData = async () => {
                try {
                    console.log(`Loading event data for banner: ${stateEventId}`);
                    const event = await getEventById(stateEventId);
                    console.log('Event data for banner:', event);
                    
                    // Get the event object from the response
                    const eventObj = event.data || event;
                    
                    // Update banner data with values from the event
                    setBannerData(prev => ({
                        ...prev,
                        title: eventObj.title || prev.title,
                        backgroundColor: eventObj.bannerSettings?.backgroundColor || prev.backgroundColor,
                        link: eventObj.meetingLink || prev.link,
                        emails: Array.isArray(eventObj.invitees) ? eventObj.invitees.join(', ') : prev.emails
                    }));
                } catch (error) {
                    console.error('Error loading event data for banner:', error);
                }
            };
            
            loadEventData();
        }
        
        // Retrieve stored event data from previous step
        const storedEventData = sessionStorage.getItem('eventFormData');
        if (!storedEventData) {
            navigate('/create-event');
            return;
        }
        
        const parsedEventData = JSON.parse(storedEventData);
        console.log('Parsed event data in EventBannerPage:', parsedEventData);
        
        // Always update the banner title from event topic
        setBannerData(prev => ({
            ...prev,
            title: parsedEventData.title || parsedEventData.eventTopic || prev.title
        }));
        
    }, [navigate, location]);
    
    // Color options
    const colorOptions = [
        { id: 'orange', value: '#EF6500' },
        { id: 'white', value: '#FFFFFF' },
        { id: 'black', value: '#000000' }
    ];
    
    // Memoize handler functions to prevent unnecessary re-renders
    const handleColorSelect = useCallback((color) => {
        setBannerData(prev => ({
            ...prev,
            backgroundColor: color
        }));
    }, []);
    
    // Handle custom color change
    const handleCustomColorChange = useCallback((e) => {
        const value = e.target.value;
        setBannerData(prev => {
            const newState = { ...prev, customColor: value };
            
            // Apply custom color to background if hex format is valid
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                newState.backgroundColor = value;
            }
            
            return newState;
        });
    }, []);
    
    // Handle input changes
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setBannerData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);
    
    // Handle save
    const handleSave = useCallback(async () => {
        // Validation
        if (!bannerData.link) {
            errorToast('Meeting link is required');
            return;
        }
        
        if (!bannerData.emails) {
            errorToast('At least one email is required');
            return;
        }
        
        try {
            setLoading(true);
            
            // Parse the stored event data
            const eventData = JSON.parse(sessionStorage.getItem('eventFormData'));
            if (!eventData) {
                throw new Error('Event data not found');
            }
            
            console.log('Event data from session:', eventData);
            
            try {
                // Parse the date from the event data
                const dateStr = eventData.date;
                
                // Parse date string to get parts
                const dateParts = dateStr.split('/');
                if (dateParts.length !== 3) {
                    throw new Error('Invalid date format: ' + dateStr);
                }
                
                // Extract date components
                let day = parseInt(dateParts[0], 10);
                let month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
                let year = parseInt(dateParts[2], 10);
                
                // Add 2000 if year is less than 100 (assumes 2-digit year format)
                if (year < 100) {
                    year += 2000;
                }
                
                // Format date as ISO string for API
                const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                console.log('Formatted ISO date:', formattedDate);
                
                // Get time components
                const time = eventData.time || '12:00';
                const period = eventData.period || 'PM';
                
                // Create Date objects for start and end
                const startDate = new Date(year, month, day);
                const endDate = new Date(year, month, day);
                
                // Parse time into hours and minutes
                const [timeHours, timeMinutes] = time.split(':').map(Number);
                
                // Adjust for AM/PM
                let hours = timeHours;
                if (period === 'PM' && hours < 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }
                
                // Set the time on the date objects
                startDate.setHours(hours, timeMinutes, 0, 0);
                
                // For end time, add the duration
                const durationMatch = eventData.duration ? eventData.duration.match(/(\d+)/) : null;
                const durationHours = durationMatch ? parseInt(durationMatch[1], 10) : 1;
                const durationMinutes = durationHours * 60;
                
                // Calculate end time
                endDate.setTime(startDate.getTime() + (durationMinutes * 60 * 1000));
                
                // Format times for display and API
                const formatTime = (date) => {
                    // User-friendly format for display
                    const displayTime = date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    });
                    
                    // 24-hour format for API (HH:MM)
                    const apiTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                    
                    // Return both formats
                    return {
                        display: displayTime,
                        api: apiTime
                    };
                };
                
                const startTimeObj = formatTime(startDate);
                const endTimeObj = formatTime(endDate);
                
                // Use different formats for display vs API
                const startTimeDisplay = startTimeObj.display;
                const endTimeDisplay = endTimeObj.display;
                const startTimeApi = startTimeObj.api;
                const endTimeApi = endTimeObj.api;
                
                console.log('Final time range for event (display):', startTimeDisplay, '-', endTimeDisplay);
                console.log('Final time range for event (API format):', startTimeApi, '-', endTimeApi);
                
                // Prepare list of invitees
                const invitees = bannerData.emails ? bannerData.emails.split(',').map(email => email.trim()) : [];
                
                // Check availability for each invitee
                let availabilityConflicts = [];
                
                for (const email of invitees) {
                    try {
                        console.log(`Checking availability for ${email} on ${formattedDate} from ${eventData.startTime || startTimeApi} to ${eventData.endTime || endTimeApi}`);
                        const checkResult = await checkAvailabilityConflict(
                            email, // Use email as userId for the check
                            formattedDate,
                            eventData.startTime || startTimeApi,
                            eventData.endTime || endTimeApi
                        );
                        
                        console.log(`Availability check result for ${email}:`, checkResult);
                        // Make sure we handle both possible response formats
                        const isAvailable = checkResult.available === undefined 
                            ? checkResult.success !== false 
                            : checkResult.available;
                            
                        if (!isAvailable) {
                            availabilityConflicts.push({
                                email,
                                message: checkResult.message || "Time conflict detected"
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to check availability for ${email}:`, error);
                        // Don't block if availability check fails
                    }
                }
                
                // If we have conflicts, ask the user if they want to continue
                if (availabilityConflicts.length > 0) {
                    console.log('Availability conflicts detected:', availabilityConflicts);
                    
                    // Use the custom errorToast instead of react-toastify
                    errorToast("Availability conflicts. Email addresses with conflicts: " + 
                        availabilityConflicts.map(conflict => conflict.email).join(', '), 5000);
                    
                    setLoading(false);
                    return;
                } else {
                    // No conflicts, proceed with event creation
                    await continueEventCreation(eventData, formattedDate, invitees, startTimeDisplay, endTimeDisplay, durationMinutes, startTimeApi, endTimeApi);
                }
            } catch (error) {
                console.error('Date format error:', error);
                errorToast('Invalid date format: ' + error.message);
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error saving event:', error);
            errorToast(error.message || 'Failed to save event');
        } finally {
            setLoading(false);
        }
    }, [bannerData, errorToast, successToast, navigate, isEditMode, eventId, userId]);
    
    // Helper function to continue with event creation
    const continueEventCreation = async (eventData, formattedDate, invitees, startTimeDisplay, endTimeDisplay, durationMinutes, startTimeApi, endTimeApi) => {
        try {
            // Helper to clean time format
            const cleanTimeFormat = (timeStr) => {
                if (!timeStr) return '';
                
                // Handle 24-hour format with incorrect PM suffix (like "15:45 PM")
                if (/^\d{1,2}:\d{2}\s*PM$/i.test(timeStr)) {
                    const [time, period] = timeStr.split(/\s+/);
                    const [hours, minutes] = time.split(':');
                    if (parseInt(hours, 10) > 12) {
                        // Convert to proper 12-hour format
                        const hours12 = parseInt(hours, 10) % 12;
                        return `${hours12}:${minutes} PM`;
                    }
                }
                return timeStr;
            };
            
            // Use formatted data already available in eventData when possible
            let formattedStartTime = eventData.startTime || `${eventData.time} ${eventData.period}`;
            let formattedEndTime = eventData.displayEndTime || eventData.endTime;
            
            // Clean up time formats
            formattedStartTime = cleanTimeFormat(formattedStartTime);
            formattedEndTime = cleanTimeFormat(formattedEndTime);
            
            // Use timeRange if available or construct it
            const timeRange = eventData.timeRange || 
                `${formattedStartTime} - ${formattedEndTime}`;
            
            console.log('Using formatted times:', {
                date: eventData.isoDate || formattedDate, 
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                timeRange: timeRange
            });
            
            // Get the event type to use (ensure we have it from some source)
            const eventType = eventData.eventType || eventData.type || 'Meeting';
            
            // Combine event data and banner data
            const combinedData = {
                title: bannerData.title || eventData.title || eventData.eventTopic || 'Team A Meeting-1',
                description: eventData.description,
                date: eventData.date || formattedDate,
                isoDate: eventData.isoDate || formattedDate, // ISO date for API
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                timeRange: timeRange, // Add timeRange for display on event cards
                duration: eventData.durationMinutes || durationMinutes || parseInt(eventData.duration) || 60,
                timezone: eventData.timeZone || '(UTC +5:00 Delhi)',
                meetingLink: bannerData.link,
                hostId: userId,
                type: eventType,
                eventType: eventType, // Set both for cross-compatibility
                bannerSettings: {
                    backgroundColor: bannerData.backgroundColor
                },
                invitees: invitees
            };
            
            console.log('Creating event with combined data:', combinedData);
            
            // Validate the data before sending
            if (!combinedData.startTime || !combinedData.endTime) {
                throw new Error('Invalid time format');
            }
            
            if (!combinedData.date) {
                throw new Error('Invalid date format');
            }
            
            if (!combinedData.hostId) {
                throw new Error('Host ID is required');
            }
            
            let result;
            
            // Import the eventType update function here to avoid circular imports
            const { updateEventType } = require('../services/availabilityService');
            
            // Save the event type preference first
            try {
                console.log('Saving event type preference:', eventType);
                await updateEventType(eventType);
            } catch (prefError) {
                console.warn('Could not save event type preference:', prefError);
                // Continue with event creation even if preference save fails
            }
            
            if (isEditMode && eventId) {
                // This is an update operation
                console.log(`Updating event ${eventId} with data:`, combinedData);
                // Add the event ID to the data to ensure it gets properly updated
                combinedData.id = eventId;
                combinedData._id = eventId; // Include both id formats for compatibility
                result = await updateEvent(eventId, combinedData);
                console.log('Event update result:', result);
                successToast('Event updated successfully!');
            } else {
                // This is a create operation
                console.log('Creating event with data:', combinedData);
                result = await createEvent(combinedData);
                console.log('Event creation result:', result);
                successToast('Event created successfully!');
            }
            
            // Clear session storage
            sessionStorage.removeItem('eventFormData');
            
            // Before navigating, ensure we store the event type in session storage 
            // to retain it for new events creation
            try {
                sessionStorage.setItem('lastUsedEventType', eventType);
            } catch (e) {
                console.warn('Could not save last used event type to session storage:', e);
            }
            
            // Navigate to events page
            navigate('/events');
        } catch (error) {
            console.error('Error in continueEventCreation:', error);
            errorToast(error.message || 'Failed to save event');
            setLoading(false);
        }
    };
    
    // Handle cancel
    const handleCancel = useCallback(() => {
        // Navigate back to create event page with the event ID if in edit mode
        if (isEditMode && eventId) {
            navigate('/create-event', { state: { eventId } });
        } else {
        navigate('/create-event');
        }
    }, [isEditMode, eventId, navigate]);
    
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
    
    return (
        <div className={styles.pageContainer}>
            <div className={styles.headerSection}>
                <h1 className={styles.title}>Create Event</h1>
                <p className={styles.description}>
                    Create events to share for people to book on your calendar.
                </p>
                <p className={styles.description} style={{ top: '125px' }}>
                    New
                </p>
            </div>
            
            <div className={styles.contentFrame}>
                <div className={styles.addEventHeader}>Add Event</div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Banner</h2>
                    
                    <div className={styles.bannerPreview} style={{ backgroundColor: bannerData.backgroundColor }}>
                        <div className={styles.avatarCircle}>
                            <img 
                                src={boySvg} 
                                alt="Profile" 
                                className={styles.avatarImage}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <div className={styles.editIcon}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 12H12" stroke="white" strokeWidth="0.8" />
                                <path d="M8 4H12V8" stroke="white" strokeWidth="0.8" />
                                <path d="M12 4L8 8" stroke="white" strokeWidth="0.8" />
                            </svg>
                        </div>
                        <h3 className={styles.bannerTitle}>{bannerData.title}</h3>
                    </div>
                    
                    <div className={styles.colorOptions}>
                        <p className={styles.colorTitle}>Custom Background Color</p>
                        <div className={styles.colorPalette}>
                            {colorOptions.map(color => (
                                <div 
                                    key={color.id}
                                    className={styles.colorOption}
                                    style={{ backgroundColor: color.value, border: color.value === '#FFFFFF' ? '0.8px solid rgba(0, 0, 0, 0.18)' : 'none' }}
                                    onClick={() => handleColorSelect(color.value)}
                                />
                            ))}
                        </div>
                        
                        <div className={styles.customColorContainer}>
                            <div 
                                className={styles.colorPreview} 
                                style={{ backgroundColor: bannerData.customColor }}
                            />
                            <input 
                                type="text" 
                                value={bannerData.customColor}
                                onChange={handleCustomColorChange}
                                className={styles.colorInput}
                            />
                        </div>
                    </div>
                </div>
                
                <div className={styles.divider}></div>
                
                <div className={styles.inputsSection}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="link" className={styles.label}>
                            Add link <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="link"
                            name="link"
                            type="text"
                            className={styles.input}
                            placeholder="Enter URL Here"
                            value={bannerData.link}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="emails" className={styles.label}>
                            Add Emails <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="emails"
                            name="emails"
                            type="text"
                            className={styles.input}
                            placeholder="Add member Emails"
                            value={bannerData.emails}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
                
                <div className={styles.actions}>
                    <button 
                        className={styles.cancelButton}
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventBannerPage; 
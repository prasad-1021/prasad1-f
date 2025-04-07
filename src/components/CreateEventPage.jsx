import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CreateEventPage.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './GoogleCalendarStyles.css'; // Import custom styles for Calendar
import { format as formatDate } from 'date-fns';
import { getEventById } from '../services/eventService';
import { getEventType } from '../services/availabilityService';

const CreateEventPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { successToast, errorToast } = useToast();
    const [loading, setLoading] = useState(false);
    const calendarRef = useRef(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [eventId, setEventId] = useState(null);

    // Calendar state
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    // Dropdown states
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
    const [tzDropdownOpen, setTzDropdownOpen] = useState(false);
    const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
    const [hostDropdownOpen, setHostDropdownOpen] = useState(false);

    // Available options - 12-hour format options only
    const timeOptions = [
        '12:00', '12:30', 
        '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30',
        '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', 
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'
    ];
    const periodOptions = ['AM', 'PM'];
    const tzOptions = ['(UTC +5:00 Delhi)', '(UTC +0:00 London)', '(UTC -5:00 New York)', '(UTC -8:00 Los Angeles)'];
    const durationOptions = ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours'];

    // Form state
    const [eventData, setEventData] = useState({
        eventTopic: '',
        password: '',
        hostName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '',
        description: '',
        date: '',
        time: '11:00',
        period: 'AM',
        timeZone: '(UTC +5:00 Delhi)',
        duration: '1 hour',
        eventType: 'Meeting'
    });

    // Format date to dd/mm/yy with more robust handling
    const formatDateString = (date) => {
        if (!date) return '';
        try {
            return formatDate(date, 'dd/MM/yy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // Handle date selection with better error handling
    const handleDateChange = (date) => {
        try {
            const formattedDate = formatDateString(date);
            setSelectedDate(date);
            setEventData(prev => ({
                ...prev,
                date: formattedDate
            }));
            setShowCalendar(false);
        } catch (error) {
            console.error('Error changing date:', error);
            errorToast('Failed to set date. Please try again.');
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for eventTopic
        if (name === 'eventTopic') {
            console.log('Event topic changed to:', value);
        }
        
        setEventData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle dropdown selection
    const handleSelectOption = (field, value) => {
        console.log(`Selecting ${field}:`, value);
        
        // Ensure specific types for form values
        let processedValue = value;
        if (field === 'duration') {
            // Always ensure duration is a string
            processedValue = String(value);
            console.log('Ensuring duration is a string:', processedValue);
        }
        
        // For time selection, update period to PM for afternoon hours
        if (field === 'time') {
            const hour = parseInt(value.split(':')[0], 10);
            // For hours ≥ 4 and ≤ 11, suggest PM by default
            if (hour >= 4 && hour <= 11) {
                setEventData(prev => ({
                    ...prev,
                    period: 'PM',
                    [field]: processedValue
                }));
                console.log(`Auto-suggesting PM period for ${value}`);
                
                // Close all dropdowns
                setTimeDropdownOpen(false);
                setPeriodDropdownOpen(false);
                setTzDropdownOpen(false);
                setDurationDropdownOpen(false);
                setHostDropdownOpen(false);
                return;
            }
        }
        
        // Keep eventType handling logic even without the UI element
        if (field === 'eventType') {
            console.log('Setting event type to:', processedValue);
            // Store in session to prevent reset when switching features
            try {
                const storedData = sessionStorage.getItem('eventFormData');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    parsedData.eventType = processedValue;
                    parsedData.type = processedValue; // Store both for compatibility
                    sessionStorage.setItem('eventFormData', JSON.stringify(parsedData));
                }
            } catch (error) {
                console.error('Error updating session storage:', error);
            }
        }
        
        setEventData(prev => ({
            ...prev,
            [field]: processedValue
        }));
        
        // Close the corresponding dropdown
        setTimeDropdownOpen(false);
        setPeriodDropdownOpen(false);
        setTzDropdownOpen(false);
        setDurationDropdownOpen(false);
        setHostDropdownOpen(false);
    };

    // Load event data for editing
    useEffect(() => {
        // Check if we're in edit mode by checking for eventId in location state
        if (location.state && location.state.eventId) {
            const id = location.state.eventId;
            console.log('Edit mode detected with event ID:', id);
            setEventId(id);
            setIsEditMode(true);
            
            // Load event data for editing - first try from location state for better reliability
            const loadEventData = async () => {
                try {
                    setLoading(true);
                    let eventData = null;
                    
                    // First check if event data is in location state
                    if (location.state.event) {
                        console.log('Using event data from location state:', location.state.event);
                        eventData = location.state.event;
                    } else {
                        // Try to load from session storage next
                        try {
                            const sessionData = sessionStorage.getItem('editingEventData');
                            if (sessionData) {
                                const parsedData = JSON.parse(sessionData);
                                console.log('Using event data from session storage:', parsedData);
                                eventData = parsedData;
                            }
                        } catch (sessionError) {
                            console.error('Error loading from session storage:', sessionError);
                        }
                        
                        // If still no data, fetch from API
                        if (!eventData) {
                            console.log('Fetching event data from API for id:', id);
                            const response = await getEventById(id);
                            console.log('Fetched event data from API:', response);
                            
                            if (!response.success) {
                                throw new Error(response.message || 'Failed to fetch event data');
                            }
                            
                            eventData = response.data;
                        }
                    }
                    
                    console.log('Processing event for editing:', eventData);
                    
                    // Extract time and period from event time if available
                    let time = '02:30';
                    let period = 'PM';
                    
                    if (eventData.startTime) {
                        try {
                            // Handle 24-hour format
                            if (eventData.startTime.includes(':') && !eventData.startTime.includes(' ')) {
                                const [hours, minutes] = eventData.startTime.split(':').map(num => parseInt(num, 10));
                                
                                if (hours >= 12) {
                                    time = `${hours === 12 ? 12 : hours - 12}:${minutes.toString().padStart(2, '0')}`;
                                    period = 'PM';
                                } else {
                                    time = `${hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')}`;
                                    period = 'AM';
                                }
                            } 
                            // Handle 12-hour format
                            else if (eventData.startTime.includes(' ')) {
                                const timeParts = eventData.startTime.split(' ');
                                if (timeParts.length >= 2) {
                                    time = timeParts[0];
                                    period = timeParts[1].toUpperCase();
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing time:', error);
                        }
                    }
                    
                    // Update form data with event details
                    setEventData({
                        eventTopic: eventData.title || '',
                        password: eventData.password || '',
                        hostName: eventData.host || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : ''),
                        description: eventData.description || '',
                        date: eventData.date || '',
                        time: time,
                        period: period,
                        timeZone: eventData.timeZone || '(UTC +5:00 Delhi)',
                        duration: eventData.duration ? String(eventData.duration) : '1 hour',
                        eventType: eventData.type || eventData.eventType || 'Meeting'
                    });
                    
                    if (eventData.date) {
                        try {
                            let dateObj;
                            if (eventData.date.includes('/')) {
                                const parts = eventData.date.split('/');
                                if (parts.length === 3) {
                                    const day = parseInt(parts[0], 10);
                                    const month = parseInt(parts[1], 10) - 1;
                                    const year = parseInt(parts[2], 10) + (parts[2].length === 2 ? 2000 : 0);
                                    dateObj = new Date(year, month, day);
                                }
                            } else {
                                dateObj = new Date(eventData.date);
                            }
                            
                            if (dateObj && !isNaN(dateObj.getTime())) {
                                setSelectedDate(dateObj);
                            }
                        } catch (error) {
                            console.error('Error parsing date:', error);
                        }
                    }
                    
                    successToast('Event loaded for editing');
                } catch (error) {
                    console.error('Error fetching event for edit:', error);
                    errorToast(error.message || 'Failed to load event data');
                    navigate(-1); // Go back if event can't be loaded
                } finally {
                    setLoading(false);
                }
            };
            
            loadEventData();
        } else {
            // If not in edit mode, try to fetch the preferred event type
            const fetchPreferredEventType = async () => {
                try {
                    // First check if we have a lastUsedEventType in session storage
                    const lastUsedEventType = sessionStorage.getItem('lastUsedEventType');
                    if (lastUsedEventType) {
                        console.log('Using last used event type from session:', lastUsedEventType);
                        setEventData(prev => ({
                            ...prev,
                            eventType: lastUsedEventType
                        }));
                        return; // Skip further checks if we have a last used type
                    }
                    
                    // Next, check if we have eventFormData in session storage
                    const storedData = sessionStorage.getItem('eventFormData');
                    // Check if we already have event type in session (user is in the middle of creating an event)
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        if (parsedData.eventType || parsedData.type) {
                            console.log('Using event type from session:', parsedData.eventType || parsedData.type);
                            setEventData(prev => ({
                                ...prev,
                                eventType: parsedData.eventType || parsedData.type || prev.eventType
                            }));
                            return; // Skip fetching if we already have it in session
                        }
                    }
                    
                    // Only fetch from API if not found in session storage
                    const response = await getEventType();
                    if (response.success && response.data && response.data.eventType) {
                        // Update the event type in the form with the preferred value
                        setEventData(prev => ({
                            ...prev,
                            eventType: response.data.eventType
                        }));
                        
                        if (response.fromDefault) {
                            console.log('Using default event type:', response.data.eventType);
                        } else {
                            console.log('Set preferred event type from user preferences:', response.data.eventType);
                        }
                    }
                } catch (error) {
                    console.warn('Could not fetch preferred event type, using default:', error);
                    // Continue with default event type from the state
                }
            };
            
            fetchPreferredEventType();
        }
    }, [location.state, navigate, user, successToast, errorToast]);

    // Enhanced sessionStorage handling with proper error feedback
    const saveToSessionStorage = (key, data) => {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving to session storage: ${error.message}`);
            errorToast('Failed to save data temporarily. Your event may not be properly saved.');
            return false;
        }
    };

    // Enhanced session storage handling in handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedDate) {
            errorToast('Please select a date');
            return;
        }
        
        const timeString = eventData.time || '08:00';
        const period = eventData.period || 'AM';
        
        let endTimeString = '';
        let endTimePeriod = '';
        let durationMinutes = 60; // Default value if calculation fails
        
        try {
            // Parse the time into hours and minutes with validation
            const timeParts = timeString.split(':');
            if (timeParts.length !== 2) {
                throw new Error('Invalid time format');
            }
            
            let hours = parseInt(timeParts[0], 10);
            let minutes = parseInt(timeParts[1], 10);
            
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 12 || minutes < 0 || minutes > 59) {
                throw new Error('Invalid time values');
            }
            
            // Adjust hours for PM if needed
            if (period === 'PM' && hours < 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
            
            // Get duration in minutes with better validation
            const durationMatch = eventData.duration.match(/(\d+(?:\.\d+)?)\s*(min|hour|hours)/i);
            if (!durationMatch) {
                throw new Error('Invalid duration format');
            }
            
            const durationValue = parseFloat(durationMatch[1]);
            const durationUnit = durationMatch[2].toLowerCase();
            
            // Convert to minutes
            if (durationUnit.includes('hour')) {
                durationMinutes = durationValue * 60;
            } else {
                durationMinutes = durationValue;
            }
            
            // Calculate end time
            const totalMinutes = hours * 60 + minutes;
            const endTotalMinutes = totalMinutes + durationMinutes;
            
            const endHours = Math.floor(endTotalMinutes / 60) % 24;
            const endMinutes = Math.floor(endTotalMinutes % 60);
            
            // Format both 24-hour and 12-hour format of end time
            endTimeString = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            
            // Calculate 12-hour format for display
            let displayEndHours;
            
            if (endHours === 0) {
                displayEndHours = 12;
                endTimePeriod = 'AM';
            } else if (endHours < 12) {
                displayEndHours = endHours;
                endTimePeriod = 'AM';
            } else if (endHours === 12) {
                displayEndHours = 12;
                endTimePeriod = 'PM';
            } else {
                displayEndHours = endHours - 12;
                endTimePeriod = 'PM';
            }
            
            // Format the 12-hour version for user-friendly display
            const formattedEndTime = `${displayEndHours}:${endMinutes.toString().padStart(2, '0')} ${endTimePeriod}`;
            
            console.log(`Calculated end time: ${endTimeString} (${formattedEndTime}) for start time ${timeString} ${period} + ${durationValue} ${durationUnit}`);
        } catch (error) {
            console.error('Error calculating end time:', error);
            errorToast('Failed to calculate event duration. Please check your inputs.');
            return;
        }
        
        // Debug log for event topic
        console.log('Event topic being saved:', eventData.eventTopic);
        console.log('Event type being saved:', eventData.eventType);
        
        // Format date in dd/mm/yy format
        const dateStr = formatDateString(selectedDate);
        
        // Also create ISO format date for API compatibility
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;
        
        const formattedData = {
            title: eventData.eventTopic,
            password: eventData.password,
            host: eventData.hostName,
            description: eventData.description,
            date: dateStr,
            isoDate: isoDate,
            time: timeString,
            period: period,
            startTime: `${timeString} ${period}`,
            endTime: endTimeString,
            displayEndTime: `${endTimeString} ${endTimePeriod}`,
            timeZone: eventData.timeZone,
            duration: eventData.duration,
            durationMinutes: durationMinutes,
            eventType: eventData.eventType,
            type: eventData.eventType, // Make sure both fields are set for compatibility
            eventTopic: eventData.eventTopic,  // Add this as a backup
            timeRange: `${timeString} ${period} - ${endTimeString} ${endTimePeriod}` // Add for compatibility
        };
        
        if (isEditMode && eventId) {
            formattedData.eventId = eventId;
        }

        // Log the data being saved to session storage
        console.log('Data being saved to session storage:', formattedData);

        // Use enhanced session storage function
        if (!saveToSessionStorage('eventFormData', formattedData)) {
            return; // Don't navigate if saving failed
        }
        
        navigate('/event-banner', { state: { isEditMode, eventId } });
    };

    // Handle cancel button click
    const handleCancel = () => {
        navigate('/events');
    };

    // Close dropdowns when clicking outside
    const handleClickOutside = (e) => {
        // Fix the CSS selector by escaping special characters like +
        // Use CSS.escape() to properly escape any special characters in the class name
        const selectWrapperClass = CSS.escape(styles.selectWrapper);
        const isDropdownTrigger = e.target.closest(`.${selectWrapperClass}`);
        
        if (!isDropdownTrigger) {
            if (calendarRef.current && !calendarRef.current.contains(e.target) && 
                !e.target.classList.contains(styles.dateInput)) {
                setShowCalendar(false);
            }
            
            setTimeDropdownOpen(false);
            setPeriodDropdownOpen(false);
            setTzDropdownOpen(false);
            setDurationDropdownOpen(false);
            setHostDropdownOpen(false);
        }
    };

    // Set up click outside listener
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load saved event data from session storage
    useEffect(() => {
        // Only load from session storage if not in edit mode
        if (!isEditMode) {
            try {
                const storedData = sessionStorage.getItem('eventFormData');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    // Only update if we have relevant data
                    if (parsedData.eventType || parsedData.type) {
                        console.log('Restoring event data from session:', parsedData);
                        setEventData(prev => ({
                            ...prev,
                            eventType: parsedData.eventType || parsedData.type || prev.eventType,
                            // Restore other fields as needed
                            eventTopic: parsedData.title || prev.eventTopic,
                            description: parsedData.description || prev.description,
                            date: parsedData.date || prev.date,
                            duration: parsedData.duration ? String(parsedData.duration) : prev.duration
                        }));
                    }
                }
            } catch (error) {
                console.error('Error loading session data:', error);
            }
        }
    }, [isEditMode]);

    // Prevent direct input on dropdown fields
    const handleDropdownInputChange = (e) => {
        e.preventDefault();
        return false;
    };

    return (
        <div className={styles.createEventPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Create Event</h1>
                <p className={styles.subtitle}>
                    Create events to share for people to book on your calendar.<br />
                    New
                </p>
            </div>

            <div className={styles.formContainer}>
                <div className={styles.formContent}>
                    <h2 className={styles.formTitle}>Add Event</h2>
                    
                    <div className={styles.formDivider}></div>

                    <form onSubmit={handleSubmit}>
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
                                    value={eventData.hostName}
                                    onChange={handleInputChange}
                                    required
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHostDropdownOpen(!hostDropdownOpen);
                                    }}
                                />
                                <div 
                                    className={styles.selectArrow}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHostDropdownOpen(!hostDropdownOpen);
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                {hostDropdownOpen && (
                                    <div className={styles.dropdownMenu}>
                                        {user?.firstName && (
                                            <div 
                                                className={styles.dropdownItem}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectOption('hostName', `${user.firstName} ${user.lastName || ''}`);
                                                }}
                                            >
                                                {`${user.firstName} ${user.lastName || ''}`}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                placeholder=""
                                value={eventData.description}
                                onChange={handleInputChange}
                            ></textarea>
                        </div>

                        <div className={styles.formDivider}></div>

                        <div className={styles.formGroup}>
                            <label htmlFor="date" className={styles.label}>
                                Date and time <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.dateTimeGroup}>
                                <div className={styles.selectWrapper}>
                                    <input
                                        id="date"
                                        name="date"
                                        type="text"
                                        className={styles.dateInput}
                                        placeholder="dd/mm/yy"
                                        value={eventData.date}
                                        onChange={handleInputChange}
                                        required
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCalendar(!showCalendar);
                                        }}
                                        readOnly
                                    />
                                    <small className={styles.formatHint}>Format: dd/mm/yy</small>
                                    <div 
                                        className={styles.selectArrow}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCalendar(!showCalendar);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    {showCalendar && (
                                        <div className={styles.calendarContainer} ref={calendarRef}>
                                            <Calendar
                                                onChange={handleDateChange}
                                                value={selectedDate || new Date()}
                                                className={`${styles.calendar} google-calendar-style`}
                                                minDate={new Date()}
                                                calendarType="gregory"
                                                prev2Label={null}
                                                next2Label={null}
                                                navigationLabel={({ date }) => formatDate(date, 'MMMM yyyy')}
                                                tileClassName={({ date, view }) => {
                                                    if (view === 'month') {
                                                        let classes = ['google-calendar-tile'];
                                                        
                                                        // Check if the date is today
                                                        const today = new Date();
                                                        const isToday = date.getDate() === today.getDate() &&
                                                                       date.getMonth() === today.getMonth() &&
                                                                       date.getFullYear() === today.getFullYear();
                                                        
                                                        // Check if the date is the selected date
                                                        const isSelected = selectedDate && 
                                                                        date.getDate() === selectedDate.getDate() &&
                                                                        date.getMonth() === selectedDate.getMonth() &&
                                                                        date.getFullYear() === selectedDate.getFullYear();
                                                        
                                                        if (isToday) classes.push('today');
                                                        if (isSelected) classes.push('selected');
                                                        
                                                        return classes.join(' ');
                                                    }
                                                    return null;
                                                }}
                                                navigationAriaLabel="Navigate by month"
                                                prevLabel={<span className="calendar-nav-arrow">‹</span>}
                                                nextLabel={<span className="calendar-nav-arrow">›</span>}
                                                onClickDay={(value) => {
                                                    // Format date for tooltip if needed
                                                    console.log(`Selected date: ${formatDate(value, 'EEEE, MMMM do, yyyy')}`);
                                                }}
                                                onActiveStartDateChange={({ activeStartDate, view }) => {
                                                    console.log(`View changed to ${view}, starting from ${activeStartDate}`);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className={styles.selectWrapper}>
                                    <input
                                        id="time"
                                        name="time"
                                        type="text"
                                        className={styles.timeInput}
                                        value={eventData.time}
                                        onChange={handleInputChange}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTimeDropdownOpen(!timeDropdownOpen);
                                            setPeriodDropdownOpen(false);
                                            setTzDropdownOpen(false);
                                            setDurationDropdownOpen(false);
                                        }}
                                    />
                                    <div 
                                        className={styles.selectArrow}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTimeDropdownOpen(!timeDropdownOpen);
                                            setPeriodDropdownOpen(false);
                                            setTzDropdownOpen(false);
                                            setDurationDropdownOpen(false);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    {timeDropdownOpen && (
                                        <div className={`${styles.dropdownMenu} ${styles.timeDropdown}`}>
                                            {timeOptions.map((time) => (
                                                <div 
                                                    key={time}
                                                    className={`${styles.dropdownItem} ${eventData.time === time ? styles.selected : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectOption('time', time);
                                                    }}
                                                >
                                                    {time}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className={styles.selectWrapper}>
                                    <input
                                        id="period"
                                        name="period"
                                        type="text"
                                        className={styles.periodInput}
                                        value={eventData.period}
                                        onChange={handleDropdownInputChange}
                                        readOnly
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPeriodDropdownOpen(!periodDropdownOpen);
                                            setTimeDropdownOpen(false);
                                            setTzDropdownOpen(false);
                                            setDurationDropdownOpen(false);
                                        }}
                                    />
                                    <div 
                                        className={styles.selectArrow}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPeriodDropdownOpen(!periodDropdownOpen);
                                            setTimeDropdownOpen(false);
                                            setTzDropdownOpen(false);
                                            setDurationDropdownOpen(false);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    {periodDropdownOpen && (
                                        <div className={`${styles.dropdownMenu} ${styles.periodDropdown}`}>
                                            {periodOptions.map((period) => (
                                                <div 
                                                    key={period}
                                                    className={`${styles.dropdownItem} ${eventData.period === period ? styles.selected : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectOption('period', period);
                                                    }}
                                                >
                                                    {period}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className={styles.selectWrapper}>
                                    <input
                                        id="timeZone"
                                        name="timeZone"
                                        type="text"
                                        className={styles.timeZoneInput}
                                        value={eventData.timeZone}
                                        onChange={handleDropdownInputChange}
                                        readOnly
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTzDropdownOpen(!tzDropdownOpen);
                                            setTimeDropdownOpen(false);
                                            setPeriodDropdownOpen(false);
                                            setDurationDropdownOpen(false);
                                        }}
                                    />
                                    <div 
                                        className={styles.selectArrow}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTzDropdownOpen(!tzDropdownOpen);
                                            setTimeDropdownOpen(false);
                                            setPeriodDropdownOpen(false);
                                            setDurationDropdownOpen(false);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    {tzDropdownOpen && (
                                        <div className={`${styles.dropdownMenu} ${styles.tzDropdown}`}>
                                            {tzOptions.map((tz) => (
                                                <div 
                                                    key={tz}
                                                    className={`${styles.dropdownItem} ${eventData.timeZone === tz ? styles.selected : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectOption('timeZone', tz);
                                                    }}
                                                >
                                                    {tz}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                    onChange={handleDropdownInputChange}
                                    readOnly
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDurationDropdownOpen(!durationDropdownOpen);
                                        setTimeDropdownOpen(false);
                                        setPeriodDropdownOpen(false);
                                        setTzDropdownOpen(false);
                                    }}
                                />
                                <div 
                                    className={styles.selectArrow}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDurationDropdownOpen(!durationDropdownOpen);
                                        setTimeDropdownOpen(false);
                                        setPeriodDropdownOpen(false);
                                        setTzDropdownOpen(false);
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 9L12 15L18 9" stroke="#3694FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                {durationDropdownOpen && (
                                    <div className={`${styles.dropdownMenu} ${styles.durationDropdown}`}>
                                        {durationOptions.map((duration) => (
                                            <div 
                                                key={duration}
                                                className={`${styles.dropdownItem} ${eventData.duration === duration ? styles.selected : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectOption('duration', duration);
                                                }}
                                            >
                                                {duration}
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                {loading ? 'Saving...' : 'Next'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEventPage; 
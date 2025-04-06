import { authenticatedRequest } from './userService';

const API_URL = process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api';

/**
 * Gets the user's availability settings
 * @returns {Promise<Array>} Array of availability objects by day
 */
export const getAvailability = async () => {
  return authenticatedRequest(`${API_URL}/users/availability`);
};

/**
 * Updates the user's complete availability schedule
 * @param {Array} availabilityData - Array of availability objects by day
 * @returns {Promise<Object>} Response object
 */
export const updateAvailability = async (availabilityData) => {
  return authenticatedRequest(`${API_URL}/users/availability`, {
    method: 'PUT',
    body: JSON.stringify(availabilityData)
  });
};

/**
 * Updates availability for a specific day
 * @param {String} day - Day of the week (e.g., "Monday")
 * @param {Object} dayData - Day availability data
 * @returns {Promise<Object>} Updated availability object
 */
export const updateDayAvailability = async (day, dayData) => {
  return authenticatedRequest(`${API_URL}/users/availability/${day}`, {
    method: 'PUT',
    body: JSON.stringify(dayData)
  });
};

/**
 * Gets the user's timezone preference
 * @returns {Promise<Object>} Timezone object
 */
export const getTimezone = async () => {
  return authenticatedRequest(`${API_URL}/users/timezone`);
};

/**
 * Updates the user's timezone preference
 * @param {String} timezone - Timezone string (e.g., "Asia/Kolkata")
 * @returns {Promise<Object>} Response object
 */
export const updateTimezone = async (timezone) => {
  return authenticatedRequest(`${API_URL}/users/timezone`, {
    method: 'PUT',
    body: JSON.stringify({ timezone })
  });
};

/**
 * Checks if a proposed event conflicts with user's availability
 * @param {Object} eventData - Event data with date, startTime, endTime
 * @returns {Promise<Object>} Response indicating if the event conflicts
 */
export const checkAvailabilityConflict = async (eventData) => {
  return authenticatedRequest(`${API_URL}/meetings/check-availability`, {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

/**
 * Converts a time from UTC to a specific timezone
 * @param {String} timeStr - Time string in format "HH:MM" (24-hour format)
 * @param {String} date - Date string in format "YYYY-MM-DD"
 * @param {String} fromTz - Source timezone
 * @param {String} toTz - Target timezone
 * @returns {String} Converted time string in "HH:MM" format
 */
export const convertTimeToTimezone = (timeStr, date, fromTz = 'UTC', toTz) => {
  try {
    if (!timeStr || !date) return timeStr;
    
    // Get user's timezone if not specified
    if (!toTz) {
      const userTimezone = localStorage.getItem('cnnct_timezone') || 'Asia/Kolkata';
      toTz = userTimezone;
    }
    
    // Create Date object in source timezone
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateObj = new Date(`${date}T${timeStr}:00Z`);
    
    // Convert to target timezone
    const options = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: toTz 
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error converting timezone:', error);
    return timeStr; // Return original time if conversion fails
  }
};

/**
 * Converts a date and time to user's local timezone
 * @param {String} dateStr - Date string in format "YYYY-MM-DD"
 * @param {String} timeStr - Time string in format "HH:MM"
 * @returns {Object} Object with converted date and time
 */
export const convertToUserTimezone = (dateStr, timeStr) => {
  try {
    // Get user's timezone from localStorage or use default
    const userTimezone = localStorage.getItem('cnnct_timezone') || 'Asia/Kolkata';
    
    // Create a Date object for the given date and time in UTC
    const dateObj = new Date(`${dateStr}T${timeStr}:00Z`);
    
    // Format options for date and time in user's timezone
    const dateOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: userTimezone 
    };
    
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: userTimezone 
    };
    
    // Convert and format
    const convertedDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(dateObj)
      .split('/').reverse().join('-');
    
    const convertedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(dateObj);
    
    return {
      date: convertedDate,
      time: convertedTime,
      timezone: userTimezone
    };
  } catch (error) {
    console.error('Error converting to user timezone:', error);
    return { date: dateStr, time: timeStr, timezone: 'UTC' };
  }
}; 
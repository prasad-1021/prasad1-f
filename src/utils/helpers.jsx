/**
 * Helper utilities for the CNNCT application
 */

/**
 * Format a date to display in a user-friendly way
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Calculate meeting duration in minutes
 * @param {string} startTime - The start time in ISO format
 * @param {string} endTime - The end time in ISO format
 * @returns {number} Duration in minutes
 */
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Truncate text to a specific length with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Simulate API call (for demo purposes)
 * @param {Object} data - The data to return
 * @param {number} delay - Delay in milliseconds
 * @param {boolean} shouldFail - Should the request fail
 * @returns {Promise} Promise that resolves with the data
 */
export const simulateApiCall = (data, delay = 1000, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('API call failed'));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

// Converts time to 12-hour format
export const formatTime = (timeString) => {
  // Check if timeString is valid
  if (!timeString) return '';
  
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeString.match(timeRegex);
  
  if (!match) return timeString;
  
  let [_, hours, minutes] = match;
  hours = parseInt(hours);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  return `${hours}:${minutes} ${period}`;
};

// Generates array of time slots
export const generateTimeOptions = (interval = 30) => {
  const options = [];
  const totalMinutesInDay = 24 * 60;
  
  for (let minutes = 0; minutes < totalMinutesInDay; minutes += interval) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    
    options.push(`${formattedHours}:${formattedMins}`);
  }
  
  return options;
};

// Formats date range for display
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Same day
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  // Same month, same year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`;
  }
  
  // Different months, same year
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`;
  }
  
  // Different years
  return `${formatDate(start)} - ${formatDate(end)}`;
};

// Gets time difference in minutes
export const getTimeDifference = (start, end) => {
  if (!start || !end) return 0;
  
  const [startHour, startMinute] = start.split(':').map(num => parseInt(num));
  const [endHour, endMinute] = end.split(':').map(num => parseInt(num));
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
}; 
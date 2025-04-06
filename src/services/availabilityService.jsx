/**
 * Availability Service
 * 
 * Provides API methods for availability management
 */

import { authenticatedRequest } from './userService';

const API_URL = process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api';
const AVAILABILITY_ENDPOINT = `${API_URL}/users/availability`;
const PREFERENCES_ENDPOINT = `${API_URL}/users/preferences`;

/**
 * Get the user's availability settings
 * @returns {Promise<Array>} Array of availability slots by day
 */
export const getAvailability = async () => {
  return authenticatedRequest(`${AVAILABILITY_ENDPOINT}`);
};

/**
 * Update the user's complete availability schedule
 * @param {Array} availability - Array of availability objects for each day
 * @returns {Promise<Object>} Updated availability data
 */
export const updateAvailability = async (availability) => {
  console.log('Updating availability with data:', availability);
  try {
    // Make sure we have valid data
    if (!Array.isArray(availability) || availability.length === 0) {
      throw new Error('Invalid availability data format');
    }
    
    const response = await authenticatedRequest(`${AVAILABILITY_ENDPOINT}`, {
      method: 'PUT',
      body: JSON.stringify({ availability })
    });
    console.log('Update availability response from API:', response);
    
    // Ensure we return a standard response format
    return {
      success: response?.success === true,
      data: response?.data || response,
      message: response?.message || 'Availability updated successfully'
    };
  } catch (error) {
    console.error('Error updating availability:', error);
    return {
      success: false,
      message: error.message || 'Failed to update availability',
      error
    };
  }
};

/**
 * Update user's availability with structured format including time gap
 * @param {Object} availabilityData - Object containing day-based availability and time gap
 * @returns {Promise<Object>} Response object
 */
export const updateUserAvailability = async (availabilityData) => {
  console.log('updateUserAvailability called with data:', availabilityData);
  
  try {
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = availabilityData;
    
    // Transform to the format expected by the backend
    const availability = [
      {
        day: 'Monday',
        isAvailable: monday.isAvailable,
        slots: monday.isAvailable && monday.timeSlots ? monday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      },
      {
        day: 'Tuesday',
        isAvailable: tuesday.isAvailable,
        slots: tuesday.isAvailable && tuesday.timeSlots ? tuesday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      },
      {
        day: 'Wednesday',
        isAvailable: wednesday.isAvailable,
        slots: wednesday.isAvailable && wednesday.timeSlots ? wednesday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      },
      {
        day: 'Thursday',
        isAvailable: thursday.isAvailable,
        slots: thursday.isAvailable && thursday.timeSlots ? thursday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      },
      {
        day: 'Friday',
        isAvailable: friday.isAvailable,
        slots: friday.isAvailable && friday.timeSlots ? friday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      },
      {
        day: 'Saturday',
        isAvailable: saturday.isAvailable,
        slots: saturday.isAvailable && saturday.timeSlots ? saturday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      },
      {
        day: 'Sunday',
        isAvailable: sunday.isAvailable,
        slots: sunday.isAvailable && sunday.timeSlots ? sunday.timeSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) : []
      }
    ];
    
    console.log('Formatted availability for API:', availability);
    
    // Update availability
    try {
      const availabilityResponse = await updateAvailability(availability);
      console.log('Update availability response:', availabilityResponse);
      
      // Explicitly return the response to prevent any default navigation
      return {
        ...availabilityResponse,
        success: availabilityResponse.success || false
      };
    } catch (error) {
      console.error('Error in updateUserAvailability:', error);
      return {
        success: false,
        message: error.message || 'Failed to update availability',
        error
      };
    }
  } catch (formattingError) {
    console.error('Error formatting availability data:', formattingError);
    return {
      success: false,
      message: 'Failed to process availability data',
      error: formattingError
    };
  }
};

/**
 * Get the user's availability and gap preferences
 * @returns {Promise<Object>} Object containing availability and time gap
 */
export const getUserAvailability = async () => {
  try {
    // Get availability data
    const availResponse = await getAvailability();
    
    if (!availResponse.success) {
      throw new Error(availResponse.message || 'Failed to fetch availability');
    }
    
    const availability = availResponse.data;
    
    // Transform availability data to structured format
    const result = {
      monday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      },
      tuesday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      },
      wednesday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      },
      thursday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      },
      friday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      },
      saturday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      },
      sunday: { 
        isAvailable: false, 
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
      }
    };
    
    // Fill in actual availability data
    availability.forEach(dayData => {
      const day = dayData.day.toLowerCase();
      result[day] = {
        isAvailable: dayData.isAvailable,
        timeSlots: dayData.slots && dayData.slots.length > 0 
          ? dayData.slots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime
            }))
          : [{ startTime: '09:00', endTime: '17:00' }]
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching availability data', error);
    throw error;
  }
};

/**
 * Update availability for a specific day
 * @param {string} day - Day of the week (Monday, Tuesday, etc.)
 * @param {boolean} isAvailable - Whether the day is available
 * @param {Array} slots - Array of time slots { startTime, endTime }
 * @returns {Promise<Object>} Updated day availability
 */
export const updateDayAvailability = async (day, isAvailable, slots) => {
  return authenticatedRequest(`${AVAILABILITY_ENDPOINT}/${day}`, {
    method: 'PUT',
    body: JSON.stringify({ isAvailable, slots })
  });
};

/**
 * Update weekend (Saturday and Sunday) availability
 * @param {Object} weekend - Object containing saturday and sunday availability
 * @param {Object} weekend.saturday - Saturday availability { isAvailable, slots }
 * @param {Object} weekend.sunday - Sunday availability { isAvailable, slots }
 * @returns {Promise<Object>} Updated weekend availability
 */
export const updateWeekendAvailability = async (weekend) => {
  return authenticatedRequest(`${AVAILABILITY_ENDPOINT}/weekend`, {
    method: 'PUT',
    body: JSON.stringify(weekend)
  });
};

/**
 * Copy time slots from one day to multiple other days
 * @param {string} sourceDay - The day to copy slots from
 * @param {Array<string>} targetDays - Array of days to copy slots to
 * @returns {Promise<Object>} Updated availability data
 */
export const copyTimeSlots = async (sourceDay, targetDays) => {
  return authenticatedRequest(`${AVAILABILITY_ENDPOINT}/copy`, {
    method: 'POST',
    body: JSON.stringify({ sourceDay, targetDays })
  });
};

/**
 * Get the user's timezone preference
 * @returns {Promise<Object>} Timezone object
 */
export const getTimezone = async () => {
  return authenticatedRequest(`${API_URL}/users/preferences/timezone`);
};

/**
 * Update the user's timezone preference
 * @param {string} timezone - The timezone string (e.g., 'Asia/Kolkata')
 * @returns {Promise<Object>} Updated preferences object
 */
export const updateTimezone = async (timezone) => {
  return authenticatedRequest(`${API_URL}/users/preferences/timezone`, {
    method: 'PUT',
    body: JSON.stringify({ timezone })
  });
};

/**
 * Update the user's event type preference
 * @param {string} eventType - The event type (e.g., 'Meeting', 'Presentation')
 * @returns {Promise<Object>} Updated preferences object
 */
export const updateEventType = async (eventType) => {
  return authenticatedRequest(`${PREFERENCES_ENDPOINT}/eventType`, {
    method: 'PUT',
    body: JSON.stringify({ eventType })
  });
};

/**
 * Get the user's event type preference
 * @returns {Promise<Object>} Event type object
 */
export const getEventType = async () => {
  try {
    const response = await authenticatedRequest(`${PREFERENCES_ENDPOINT}/eventType`);
    return response;
  } catch (error) {
    console.error('Error fetching event type preference:', error);
    // Return a default response instead of throwing the error
    return {
      success: true,
      data: { eventType: 'Meeting' },
      fromDefault: true
    };
  }
};

/**
 * Convert time to 24-hour format (HH:MM)
 * @param {string} timeStr - Time string in any format
 * @returns {string} Time in 24-hour format (HH:MM)
 */
const normalizeTo24HourFormat = (timeStr) => {
  if (!timeStr) return null;
  
  // If already in HH:MM format, return as is
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
    return timeStr;
  }
  
  // Try to parse 12-hour format with AM/PM
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  // If format doesn't match, return original string
  console.warn('Could not normalize time format:', timeStr);
  return timeStr;
};

/**
 * Check if an event conflicts with availability
 * @param {string} userId - The user ID or email address
 * @param {string} date - The date string (YYYY-MM-DD)
 * @param {string} startTime - The start time (HH:MM or any time format)
 * @param {string} endTime - The end time (HH:MM or any time format)
 * @returns {Promise<Object>} Conflict check result
 */
export const checkAvailabilityConflict = async (userId, date, startTime, endTime) => {
  // Normalize times to 24-hour format for consistency
  const normalizedStartTime = normalizeTo24HourFormat(startTime);
  const normalizedEndTime = normalizeTo24HourFormat(endTime);
  
  // Determine if we're passing an email (contains @) or a user ID
  const isEmail = userId && userId.includes('@');
  
  console.log(`Checking availability for ${isEmail ? 'email' : 'userId'}: ${userId}`);
  console.log(`Date: ${date}, Time: ${normalizedStartTime} - ${normalizedEndTime}`);
  
  try {
    const response = await authenticatedRequest(`${API_URL}/meetings/check-availability`, {
      method: 'POST',
      body: JSON.stringify({ 
        userId, // This could be an email or a user ID
        date, 
        startTime: normalizedStartTime, 
        endTime: normalizedEndTime 
      })
    });
    
    console.log(`Availability check response for ${userId}:`, response);
    return response;
  } catch (error) {
    console.error(`Error checking availability for ${userId}:`, error);
    // Return a default response to avoid breaking the flow
    return {
      success: true,
      available: true, // Default to available on error
      message: `Failed to check availability for ${userId}. Assuming available.`
    };
  }
}; 
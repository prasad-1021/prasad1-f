/**
 * Event Service
 * 
 * Provides API methods for event management
 */

import { authenticatedRequest } from './userService';
import { 
  getMockEvents,
  simulateApiDelay, 
  simulateApiError,
  addMockEvent,
  updateMockEvent,
  deleteMockEvent 
} from './mockData';

// Constants
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || false;

// Use mock data if in development mode or API_URL is not set
// API URLs
const API_URL = process.env.REACT_APP_API_URL || 'https://eventmeeting-backend.onrender.com/api';
const MEETINGS_ENDPOINT = `${API_URL}/meetings`;  // Use meetings endpoint instead of events
const EVENTS_ENDPOINT = `${API_URL}/events`;  // Events endpoint for the event types

/**
 * Gets all events
 * @returns {Promise<Array>} Array of events
 */
export const getEvents = async () => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error
    
    // Get the current events from mock store
    const currentEvents = getMockEvents();
    console.log('Current events in mock store:', currentEvents);
    
    // Ensure each event has all required fields
    const processedEvents = currentEvents.map(event => ({
      id: event.id,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      date: event.date || 'No date set',
      startTime: event.startTime || '',  // Add individual time fields
      endTime: event.endTime || '',      // Add individual time fields
      timeRange: event.timeRange || 'No time set',
      duration: event.duration || '1 hour',
      type: event.type || 'One-on-one',
      isActive: typeof event.isActive === 'boolean' ? event.isActive : true,
      enabled: typeof event.enabled === 'boolean' ? event.enabled : true,
      status: event.status || 'active',
      bannerColor: event.bannerColor || '#1877F2',
      bannerSettings: event.bannerSettings || { backgroundColor: '#1877F2' },
      meetingLink: event.meetingLink || '',
      participants: Array.isArray(event.participants) ? event.participants : [],
      invitees: Array.isArray(event.invitees) ? event.invitees : []
    }));
    
    console.log('Processed events with default values:', processedEvents);
    return processedEvents;
  }
  
  return authenticatedRequest(MEETINGS_ENDPOINT);
};

/**
 * Gets only events created by the current user (for event types page)
 * @returns {Promise<Array>} Array of events created by the current user
 */
export const getUserCreatedEvents = async () => {
  console.log('getUserCreatedEvents called');
  
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error
    
    // Get the current events from mock store
    // In mock mode, we can't reliably filter by creator, so we return all
    const currentEvents = getMockEvents();
    console.log('Current events in mock store for user-created events:', currentEvents);
    
    // Ensure each event has all required fields
    const processedEvents = currentEvents.map(event => ({
      id: event.id,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      date: event.date || 'No date set',
      startTime: event.startTime || '',  // Add individual time fields
      endTime: event.endTime || '',      // Add individual time fields
      timeRange: event.timeRange || 'No time set',
      duration: event.duration || '1 hour',
      type: event.type || 'One-on-one',
      isActive: typeof event.isActive === 'boolean' ? event.isActive : true,
      enabled: typeof event.enabled === 'boolean' ? event.enabled : true,
      status: event.status || 'active',
      bannerColor: event.bannerColor || '#1877F2',
      bannerSettings: event.bannerSettings || { backgroundColor: '#1877F2' },
      meetingLink: event.meetingLink || '',
      participants: Array.isArray(event.participants) ? event.participants : [],
      invitees: Array.isArray(event.invitees) ? event.invitees : []
    }));
    
    return processedEvents;
  }
  
  console.log('Calling API endpoint for user-created events');
  try {
    // Use the events/created endpoint - will be properly formatted by authenticatedRequest
    const response = await authenticatedRequest('events/created');
    console.log('API response for user-created events:', response);
    return response;
  } catch (error) {
    console.error('Error fetching user-created events:', error);
    throw error;
  }
};

/**
 * Fetches a single event by ID
 * @param {string} eventId - The ID of the event to fetch
 * @returns {Promise<Object>} Event object
 */
export const getEventById = async (eventId) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error
    const event = getMockEvents().find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    return { ...event }; // Return a copy to prevent mutation
  }
  
  return authenticatedRequest(`${MEETINGS_ENDPOINT}/${eventId}`);
};

/**
 * Creates a new event
 * @param {Object} eventData - The event data
 * @returns {Promise<Object>} Created event object
 */
export const createEvent = async (eventData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error for better stability
    
    console.log('Creating mock event with data:', eventData);
    
    // Create a time range string from startTime and endTime if they exist
    let timeRangeStr = 'No time set';
    if (eventData.startTime && eventData.endTime) {
      timeRangeStr = `${eventData.startTime} - ${eventData.endTime}`;
    }
    
    // Handle event type fields for cross-compatibility
    let eventType = eventData.type || eventData.eventType || 'Meeting';
    
    // Ensure event ID has consistent format with prefix
    const newEvent = {
      id: eventData.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      date: eventData.date || 'No date set',
      startTime: eventData.startTime || '',  // Add individual time fields
      endTime: eventData.endTime || '',      // Add individual time fields
      timeRange: timeRangeStr,               // Keep timeRange for backward compatibility
      duration: eventData.duration || '1 hour',
      // Set both for cross-compatibility
      type: eventType,
      eventType: eventType,
      isActive: typeof eventData.isActive === 'boolean' ? eventData.isActive : true,
      enabled: typeof eventData.enabled === 'boolean' ? eventData.enabled : true,
      status: 'active',
      createdAt: new Date().toISOString(),
      bannerColor: eventData.bannerColor || '#1877F2',
      bannerSettings: eventData.bannerSettings || { backgroundColor: '#1877F2' },
      meetingLink: eventData.meetingLink || '',
      participants: Array.isArray(eventData.participants) ? eventData.participants : [],
      invitees: Array.isArray(eventData.invitees) ? eventData.invitees : []
    };
    
    console.log('New event object created:', newEvent);
    
    // Add the event to the mock data store
    const addedEvent = addMockEvent(newEvent);
    console.log('Event added to mock store:', addedEvent);
    
    // Log the current state of mock events
    console.log('Current mock events:', getMockEvents());
    
    return addedEvent;
  }
  
  // Real API call
  return authenticatedRequest(MEETINGS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

/**
 * Updates an existing event
 * @param {string} eventId - The ID of the event to update
 * @param {Object} updateData - The new event data
 * @returns {Promise<Object>} Updated event object
 */
export const updateEvent = async (eventId, updateData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    
    console.log(`Updating mock event ${eventId} with data:`, updateData);
    
    // Create a time range string from startTime and endTime if they exist
    if (updateData.startTime && updateData.endTime) {
      updateData.timeRange = `${updateData.startTime} - ${updateData.endTime}`;
    }
    
    // Handle event type fields for cross-compatibility
    if (updateData.eventType && !updateData.type) {
      updateData.type = updateData.eventType;
    } else if (updateData.type && !updateData.eventType) {
      updateData.eventType = updateData.type;
    }
    
    // Try to update the event in the mock data store
    try {
      // Ensure both id and _id are consistent
      if (!updateData.id && updateData._id) {
        updateData.id = updateData._id;
      } else if (!updateData._id && updateData.id) {
        updateData._id = updateData.id;
      }

      // Use either id or _id for finding the event
      const normalizedId = updateData.id || updateData._id || eventId;
      
      const updatedEvent = updateMockEvent(normalizedId, updateData);
      console.log('Event updated in mock store:', updatedEvent);
      return updatedEvent;
    } catch (error) {
      console.error('Error updating mock event:', error);
      throw error;
    }
  }
  
  // Real API call
  // Ensure we're using a properly formatted request with consistent ID 
  const apiEventId = eventId.trim();
  console.log(`Making API call to update event ${apiEventId}`);
  
  // Add event ID to update data for API consistency
  const apiUpdateData = {
    ...updateData,
    id: apiEventId,
    _id: apiEventId
  };
  
  return authenticatedRequest(`${MEETINGS_ENDPOINT}/${apiEventId}`, {
    method: 'PUT',
    body: JSON.stringify(apiUpdateData)
  });
};

/**
 * Deletes an event
 * @param {string} eventId - The ID of the event to delete
 * @returns {Promise<Object>} Response object
 */
export const deleteEvent = async (eventId) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error
    return deleteMockEvent(eventId);
  }
  
  return authenticatedRequest(`${MEETINGS_ENDPOINT}/${eventId}`, {
    method: 'DELETE'
  });
};

/**
 * Toggles the status of an event (enabled/disabled)
 * @param {string} eventId - The ID of the event to toggle
 * @param {boolean} enabled - The new status
 * @returns {Promise<Object>} Updated event object
 */
export const toggleEventStatus = async (eventId, enabled) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error
    
    console.log('Attempting to toggle event status for ID:', eventId);
    console.log('Current mock events:', getMockEvents());
    
    // Check if event exists before trying to update it
    const eventExists = getMockEvents().some(e => e.id === eventId);
    if (!eventExists) {
      console.error(`Event with ID ${eventId} not found in mock store`);
      throw new Error('Event not found');
    }
    
    return updateMockEvent(eventId, { enabled });
  }
  
  return authenticatedRequest(`${MEETINGS_ENDPOINT}/${eventId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled })
  });
};

/**
 * Gets a shareable link for an event
 * @param {string} eventId - The ID of the event
 * @returns {Promise<Object>} Object containing the shareable link
 */
export const getEventLink = async (eventId) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01); // Reduced to 1% chance of error
    const event = getMockEvents().find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    return { 
      link: `https://cnnct.app/e/${eventId}`,
      eventId
    };
  }
  
  try {
    console.log(`Requesting event link for ID: ${eventId}`);
    
    // Use a raw fetch instead of authenticatedRequest to handle non-JSON responses better
    const token = localStorage.getItem('cnnct_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${MEETINGS_ENDPOINT}/${eventId}/link`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check for non-200 responses
    if (!response.ok) {
      console.error(`Error fetching event link: ${response.status} ${response.statusText}`);
      
      // Try to read the response as text to help with debugging
      try {
        const responseText = await response.text();
        console.error('Response content:', responseText.substring(0, 500)); // Log first 500 chars
      } catch (textError) {
        console.error('Could not read response text:', textError);
      }
      
      throw new Error(`Error fetching event link: ${response.status}`);
    }
    
    // Try to parse as JSON
    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      
      // If JSON parsing fails, create a fallback link
      return {
        link: `${window.location.origin}/book/${eventId}`,
        eventId,
        isGeneratedLink: true
      };
    }
  } catch (error) {
    console.error('Error in getEventLink:', error);
    // Return a fallback link instead of throwing
    return {
      link: `${window.location.origin}/book/${eventId}`,
      eventId,
      isGeneratedLink: true,
      error: error.message
    };
  }
};

/**
 * Toggles the active status of an event
 * @param {string} eventId - The ID of the event to toggle
 * @param {boolean} [isActive] - Optional: explicitly set active status
 * @returns {Promise<Object>} Updated event object
 */
export const toggleEventActive = async (eventId, isActive) => {
  console.log(`toggleEventActive called for event ID: ${eventId}, explicit isActive: ${isActive}`);
  
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01);
    
    console.log(`Toggling active status for event ID: ${eventId} in mock store`);
    
    // Check if event exists
    const event = getMockEvents().find(e => e.id === eventId || e._id === eventId);
    if (!event) {
      console.error(`Event with ID ${eventId} not found in mock store`);
      throw new Error('Event not found');
    }
    
    // Toggle or set the isActive status
    const newStatus = isActive !== undefined ? isActive : !(event.isActive || event.enabled);
    console.log(`Setting event status to: ${newStatus}`);
    
    const result = updateMockEvent(eventId, { 
      isActive: newStatus,
      enabled: newStatus // For backwards compatibility
    });
    
    // Store the complete set of mock events to localStorage for state persistence
    localStorage.setItem('userEvents', JSON.stringify(getMockEvents()));
    
    return {
      success: true,
      data: result
    };
  }
  
  console.log(`Making API request to toggle event ${eventId}`);
  const payload = isActive !== undefined ? { isActive } : {};
  
  try {
    const response = await authenticatedRequest(`${MEETINGS_ENDPOINT}/${eventId}/active`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    console.log('Toggle API response:', response);
    
    // If response doesn't have the expected structure, transform it
    if (!response.data && response.isActive !== undefined) {
      return {
        success: true,
        data: response
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error in toggleEventActive:', error);
    throw error;
  }
};

/**
 * Duplicates an existing event
 * @param {string} eventId - The ID of the event to duplicate
 * @param {Object} [customData] - Optional: custom data for the duplicated event
 * @returns {Promise<Object>} New event object
 */
export const duplicateEvent = async (eventId, customData = {}) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01);
    
    console.log(`Duplicating event ID: ${eventId}`);
    
    // Check if event exists
    const event = getMockEvents().find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Create a copy of the event with a new ID
    const newEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${event.title} (Copy)`,
      createdAt: new Date().toISOString(),
      ...customData
    };
    
    // Add to mock store
    const addedEvent = addMockEvent(newEvent);
    
    return {
      data: addedEvent,
      status: 201,
      message: 'Event duplicated successfully'
    };
  }
  
  return authenticatedRequest(`${MEETINGS_ENDPOINT}/${eventId}/duplicate`, {
    method: 'POST',
    body: JSON.stringify(customData)
  });
};

/**
 * Checks if a proposed event time conflicts with user's availability settings
 * @param {Object} eventData - The event data containing date, startTime, and endTime
 * @returns {Promise<Object>} Response indicating if the time is available
 */
export const checkAvailabilityConflict = async (eventData) => {
  if (USE_MOCK_DATA) {
    await simulateApiDelay();
    simulateApiError(0.01);
    
    console.log('Checking availability for:', eventData);
    // In mock mode, always return no conflicts
    return {
      available: true,
      message: 'Time is available'
    };
  }
  
  try {
    const response = await authenticatedRequest(`${MEETINGS_ENDPOINT}/check-availability`, {
      method: 'POST',
      body: JSON.stringify({
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime
      })
    });
    
    return response;
  } catch (error) {
    console.error('Error checking availability:', error);
    // If there's an error, assume there is a conflict to be safe
    return {
      available: false,
      message: error.message || 'Error checking availability',
      error: true
    };
  }
}; 
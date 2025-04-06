/**
 * Convert availability data from the API to calendar event format
 * @param {Array} availabilityData - Availability data from API
 * @param {Date} currentDate - Current date to generate events for
 * @returns {Array} Calendar events
 */
export const availabilityToEvents = (availabilityData, currentDate) => {
  if (!availabilityData || !Array.isArray(availabilityData)) {
    return [];
  }

  // Helper function to convert time string to Date object
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

  // Helper to get the start of the week
  const startOfWeek = (date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day;
    result.setDate(diff);
    return result;
  };

  // Helper to add days to a date
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Helper to format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const availabilityEvents = [];
  const startDate = startOfWeek(currentDate || new Date());
  
  // Map day names to day of week numbers
  const dayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  // Process each day in the availability data
  availabilityData.forEach(day => {
    if (!day.isAvailable) return;
    
    const dayName = day.day ? day.day.toLowerCase() : null;
    const dayOfWeek = dayName ? dayMap[dayName] : null;
    
    if (dayOfWeek === null || dayOfWeek === undefined) return;
    
    // Get date for this weekday
    const date = addDays(startDate, dayOfWeek);
    const dateStr = formatDate(date);
    
    // Process time slots
    if (day.slots && day.slots.length > 0) {
      day.slots.forEach(slot => {
        if (!slot.startTime || !slot.endTime) return;
        
        availabilityEvents.push({
          id: `avail-${day.day}-${slot.startTime}-${slot.endTime}`,
          title: `Available: ${slot.startTime} - ${slot.endTime}`,
          start: timeStringToDate(dateStr, slot.startTime),
          end: timeStringToDate(dateStr, slot.endTime),
          color: '#DCFCE7',  // Light green for availability
          type: 'availability'
        });
      });
    } else if (day.startTime && day.endTime) {
      // If no slots but has start/end time
      availabilityEvents.push({
        id: `avail-${day.day}-${day.startTime}-${day.endTime}`,
        title: `Available: ${day.startTime} - ${day.endTime}`,
        start: timeStringToDate(dateStr, day.startTime),
        end: timeStringToDate(dateStr, day.endTime),
        color: '#DCFCE7',  // Light green for availability
        type: 'availability'
      });
    } else {
      // If day is available but no specific times, mark entire day
      availabilityEvents.push({
        id: `avail-all-day-${day.day}`,
        title: 'Available All Day',
        start: new Date(new Date(date).setHours(0, 0, 0, 0)),
        end: new Date(new Date(date).setHours(23, 59, 59, 999)),
        color: '#DCFCE7',  // Light green for availability
        type: 'availability'
      });
    }
  });
  
  return availabilityEvents;
};

/**
 * Get color based on status
 * @param {string} status - Status string
 * @returns {string} CSS color
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
    case 'confirmed':
      return '#10B981'; // Green
    case 'pending':
      return '#F59E0B'; // Yellow
    case 'cancelled':
    case 'rejected':
      return '#EF4444'; // Red
    case 'availability':
      return '#DCFCE7'; // Light green
    default:
      return '#0EA5E9'; // Blue (default)
  }
}; 
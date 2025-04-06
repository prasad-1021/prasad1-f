export const timeSlots = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

export const defaultAvailability = {
  monday: { 
    isAvailable: true, 
    timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
  },
  tuesday: { 
    isAvailable: true, 
    timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
  },
  wednesday: { 
    isAvailable: true, 
    timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
  },
  thursday: { 
    isAvailable: true, 
    timeSlots: [{ startTime: '09:00', endTime: '17:00' }] 
  },
  friday: { 
    isAvailable: true, 
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

// Default time gap between bookings in minutes
export const defaultTimeGap = 0;

// Map from full day names to short day names
export const dayMappingToShort = {
  'Monday': 'mon',
  'Tuesday': 'tue', 
  'Wednesday': 'wed',
  'Thursday': 'thu',
  'Friday': 'fri',
  'Saturday': 'sat',
  'Sunday': 'sun'
};

// Map from short day names to full day names
export const dayMappingToFull = {
  'monday': 'Monday',
  'tuesday': 'Tuesday',
  'wednesday': 'Wednesday',
  'thursday': 'Thursday',
  'friday': 'Friday',
  'saturday': 'Saturday',
  'sunday': 'Sunday'
}; 
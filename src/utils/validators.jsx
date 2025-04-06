import { z } from 'zod';

// Helper function to validate time format (HH:MM)
const isTimeAfter = (startTime, endTime) => {
  if (!startTime || !endTime) return true;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  if (endHour > startHour) return true;
  if (endHour === startHour && endMinute > startMinute) return true;
  return false;
};

// Schema for a single time slot
const timeSlotSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required")
}).refine(
  data => isTimeAfter(data.startTime, data.endTime),
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

// Schema for a single day's availability
const dayAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  timeSlots: z.array(timeSlotSchema).optional().default([])
}).refine(
  data => !data.isAvailable || (data.timeSlots && data.timeSlots.length > 0),
  {
    message: "At least one time slot is required when available",
    path: ["timeSlots"]
  }
);

// Schema for the complete availability form
export const availabilitySchema = z.object({
  monday: dayAvailabilitySchema,
  tuesday: dayAvailabilitySchema,
  wednesday: dayAvailabilitySchema,
  thursday: dayAvailabilitySchema,
  friday: dayAvailabilitySchema,
  saturday: dayAvailabilitySchema,
  sunday: dayAvailabilitySchema,
  timeGap: z.number().min(0).max(120).default(0)
});

export const validateAvailabilityData = (data) => {
  try {
    const validData = availabilitySchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors || [{ message: 'Invalid form data' }]
    };
  }
}; 
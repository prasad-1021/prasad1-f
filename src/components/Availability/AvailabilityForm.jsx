import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../../contexts/ToastContext';
import { HiChevronDown } from 'react-icons/hi';
import styles from './AvailabilityPage.module.css';
import { timeSlots, dayMappingToFull } from './data.jsx';
import { updateUserAvailability, updateEventType, updateTimezone, getEventType } from '../../services/availabilityService';
import { availabilitySchema } from '../../utils/validators.jsx';
import CopyIcon from '../../assets/copy.svg';

const AvailabilityForm = ({ initialData, selectedEventType: propSelectedEventType, onEventTypeChange }) => {
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Use the prop value if available, otherwise fall back to initialData
  const [selectedEventType, setSelectedEventType] = useState(
    propSelectedEventType || initialData?.eventType || 'Meeting'
  );
  
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const eventTypeOptions = ['Meeting', 'Presentation', 'Doubt Session', 'Workshop', 'Lecture', 'Interview'];
  const eventTypeRef = useRef(null);
  
  const indianTimeStandards = ['Indian Standard Time (IST)', 'GMT+5:30'];
  const [selectedTimeStandard, setSelectedTimeStandard] = useState(initialData?.timezone || indianTimeStandards[0]);
  const [showTimeStandardDropdown, setShowTimeStandardDropdown] = useState(false);
  const timeStandardRef = useRef(null);
  
  // Effect to update local state when prop changes - prevent refresh when switching tabs
  useEffect(() => {
    if (propSelectedEventType && propSelectedEventType !== selectedEventType) {
      setSelectedEventType(propSelectedEventType);
    }
  }, [propSelectedEventType, selectedEventType]);
  
  const days = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
  ];
  
  // Add state for managing multiple time slots per day
  const [dayTimeSlots, setDayTimeSlots] = useState(() => {
    // Initialize from initialData if available
    const initialTimeSlots = {};
    days.forEach(day => {
      initialTimeSlots[day.id] = initialData && initialData[day.id]?.timeSlots ? 
        [...initialData[day.id].timeSlots] : 
        [{ startTime: '09:00', endTime: '17:00' }];
    });
    return initialTimeSlots;
  });
  
  // Add state for copy functionality
  const [copySource, setCopySource] = useState(null);
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger
  } = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    // Add click outside listener for dropdowns
    const handleClickOutside = (event) => {
      if (eventTypeRef.current && !eventTypeRef.current.contains(event.target)) {
        setShowEventTypeDropdown(false);
      }
      if (timeStandardRef.current && !timeStandardRef.current.contains(event.target)) {
        setShowTimeStandardDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to handle event type selection
  const handleEventTypeSelect = async (type) => {
    // Update the local state immediately
    setSelectedEventType(type);
    setShowEventTypeDropdown(false);
    
    // Notify parent component about the change to prevent refresh on tab switch
    if (onEventTypeChange) {
      onEventTypeChange(type);
    }

    try {
      // Call API to update event type
      const response = await updateEventType(type);
      
      // Only show success toast if successful
      if (response && (response.success === true || response.success === undefined)) {
      successToast('Event type updated successfully');
      } else {
        // If the update failed for some reason, revert to the previous selection
        const fallbackType = propSelectedEventType || initialData?.eventType || 'Meeting';
        setSelectedEventType(fallbackType);
        if (onEventTypeChange) {
          onEventTypeChange(fallbackType);
        }
        errorToast('Failed to update event type');
      }
    } catch (error) {
      console.error('Error updating event type', error);
      // Revert to the previous selection on error
      const fallbackType = propSelectedEventType || initialData?.eventType || 'Meeting';
      setSelectedEventType(fallbackType);
      if (onEventTypeChange) {
        onEventTypeChange(fallbackType);
      }
      errorToast('Failed to update event type');
    }
  };

  // Function to handle time standard selection
  const handleTimeStandardSelect = async (standard) => {
    setSelectedTimeStandard(standard);
    setShowTimeStandardDropdown(false);
    
    try {
      // Update the user's timezone preference
      await updateTimezone(standard);
      successToast('Time standard updated successfully');
    } catch (error) {
      console.error('Error updating time standard', error);
      errorToast('Failed to update time standard');
    }
  };

  // Function to validate if time slots overlap - fixed logic
  const checkOverlappingTimeSlots = (timeSlots) => {
    if (!timeSlots || timeSlots.length <= 1) return false; // No overlaps possible with 0 or 1 slot
    
    // Sort time slots by start time
    const sortedSlots = [...timeSlots].sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    
    // Check for overlaps
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlot = sortedSlots[i];
      const nextSlot = sortedSlots[i + 1];
      
      // If current slot's end time is after or equal to next slot's start time, they overlap
      if (currentSlot.endTime >= nextSlot.startTime) {
        return true; // Found an overlap
      }
    }
    
    return false; // No overlaps found
  };

  // Function to validate if all time slots have end time after start time - fixed logic
  const checkValidTimeRanges = (timeSlots) => {
    if (!timeSlots || timeSlots.length === 0) return true; // No slots is considered valid for this check
    
    // Check each slot for invalid time range
    for (const slot of timeSlots) {
      if (slot.startTime >= slot.endTime) {
        return false; // Invalid: start time is not before end time
      }
    }
    
    return true; // All slots have valid time ranges
  };

  const onSubmit = async (data) => {
    // Prevent multiple submissions
    if (loading) return;
    
    // Transform data structure if needed to match API expectations
    const formattedData = { ...data };
    
    // Performance improvement: use a single loop for validation and formatting
    let hasValidationErrors = false;
    const validationErrors = [];
    
    // For each day, ensure timeSlots array is properly formatted and validate
    days.forEach(day => {
      if (formattedData[day.id] && formattedData[day.id].isAvailable) {
        // Make sure the timeSlots property exists in the formatted data
        if (!formattedData[day.id].timeSlots) {
          formattedData[day.id].timeSlots = [];
        }
        
        // Use the current state of dayTimeSlots which contains the most up-to-date time slots
        const currentDaySlots = [...dayTimeSlots[day.id]];
        formattedData[day.id].timeSlots = currentDaySlots;
        
        // Check if any time slots have end time before or equal to start time
        if (!checkValidTimeRanges(currentDaySlots)) {
          hasValidationErrors = true;
          validationErrors.push(`${dayMappingToFull[day.id]}: End time must be after start time in all slots`);
        }
        
        // Check for overlapping time slots
        if (checkOverlappingTimeSlots(currentDaySlots)) {
          hasValidationErrors = true;
          validationErrors.push(`${dayMappingToFull[day.id]}: Time slots cannot overlap`);
        }
      }
    });
    
    if (hasValidationErrors) {
      // Show the first error
      errorToast(validationErrors[0]);
      console.error('Validation errors:', validationErrors);
      return;
    }
    
    console.log('Submitting availability data:', formattedData);
    
    try {
      setLoading(true); // Indicate loading state
      
      // Call API to update availability
      const response = await updateUserAvailability(formattedData);
      console.log('Availability update response:', response);
      
      // Remove the re-fetch of event type to prevent it from being overwritten
      // after user has made a selection
      
      if (response && response.success) {
        // Success notification
        successToast('Availability updated successfully!');
      } else {
        // Error notification
        const errorMsg = response?.message || 'Unknown error occurred';
        console.error('Failed to update availability:', errorMsg);
        errorToast(`Failed to update availability: ${errorMsg}`);
      }
    } catch (error) {
      // Handle exceptions
      console.error('Error updating availability:', error);
      errorToast(`Failed to update availability: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false); // Clear loading state
    }
  };

  // Function to add a new time slot with smarter defaults
  const addTimeSlot = (dayId) => {
    const existingSlots = [...dayTimeSlots[dayId]];
    
    // If there are existing slots, set default based on the last slot's end time
    let newStartTime = '09:00';
    let newEndTime = '17:00';
    
    if (existingSlots.length > 0) {
      const lastSlot = existingSlots[existingSlots.length - 1];
      
      // Add 30 minutes to last end time for new start time
      const [lastEndHour, lastEndMinute] = lastSlot.endTime.split(':').map(Number);
      
      let newHour = lastEndHour;
      let newMinute = lastEndMinute + 30;
      
      if (newMinute >= 60) {
        newHour = (newHour + 1) % 24;
        newMinute = newMinute - 60;
      }
      
      newStartTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
      
      // Add 1 hour to new start time for new end time
      newHour = (newHour + 1) % 24;
      
      newEndTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    }
    
    const newSlots = [...existingSlots, { startTime: newStartTime, endTime: newEndTime }];
    setDayTimeSlots(prev => ({ ...prev, [dayId]: newSlots }));
    
    // Update form values
    setValue(`${dayId}.timeSlots`, newSlots);
  };

  // Function to remove a time slot
  const removeTimeSlot = (dayId, index) => {
    if (dayTimeSlots[dayId].length <= 1) {
      // Don't remove the last slot
      return;
    }
    
    const newSlots = dayTimeSlots[dayId].filter((_, i) => i !== index);
    setDayTimeSlots(prev => ({ ...prev, [dayId]: newSlots }));
    
    // Update form values
    setValue(`${dayId}.timeSlots`, newSlots);
  };

  // Function to copy time slots
  const copyTimeSlots = (dayId) => {
    // If we already have a selected copy source
    if (copySource) {
      // Don't copy to the same day
      if (copySource === dayId) {
        setCopySource(null);
        return;
      }
      
      // Copy the time slots from source day to target day
      const newSlots = [...dayTimeSlots[copySource]];
      setDayTimeSlots(prev => ({ ...prev, [dayId]: newSlots }));
      
      // Update form values including isAvailable state
      const isSourceAvailable = watch(`${copySource}.isAvailable`);
      
      // Register the fields first to make sure React Hook Form is aware of them
      setValue(`${dayId}.timeSlots`, newSlots);
      setValue(`${dayId}.isAvailable`, isSourceAvailable);
      
      // Force form validation update after state change
      setTimeout(() => {
        // Trigger validation to update the form state
        trigger([`${dayId}.timeSlots`, `${dayId}.isAvailable`]);
      }, 0);
      
      // Show success message
      successToast(`Copied times from ${dayMappingToFull[copySource]} to ${dayMappingToFull[dayId]}`);
      
      // Reset copy source
      setCopySource(null);
    } else {
      // Set this day as the copy source
      setCopySource(dayId);
      successToast(`Select another day to copy ${dayMappingToFull[dayId]}'s schedule to`);
    }
  };

  // Add a useEffect to handle copy source UI effects
  useEffect(() => {
    // Only needed when copy source is set
    if (copySource) {
      // Add a class or highlight to show that other days can receive the copy
      const dayElements = document.querySelectorAll(`.${styles.dayRow}`);
      dayElements.forEach(element => {
        if (element.getAttribute('data-day-id') !== copySource) {
          element.classList.add(styles.canReceiveCopy);
        } else {
          element.classList.add(styles.copySource);
        }
      });
      
      // Cleanup function to remove classes when copy is done
      return () => {
        dayElements.forEach(element => {
          element.classList.remove(styles.canReceiveCopy, styles.copySource);
        });
      };
    }
  }, [copySource, styles]);

  return (
    <div className={styles.configContainer}>
      <div className={styles.configHeader}>
        <div className={styles.configSection}>
          <h3>Event Type</h3>
          <div ref={eventTypeRef} className={styles.eventTypeContainer}>
            <p 
              className={`${styles.configLabel} ${styles.eventTypeLabel}`}
              onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
            >
              {selectedEventType}
              <HiChevronDown className={styles.dropdownIcon} />
            </p>
            {showEventTypeDropdown && (
              <div className={styles.eventTypeDropdown}>
                {eventTypeOptions.map(type => (
                  <div 
                    key={type} 
                    className={`${styles.eventTypeOption} ${selectedEventType === type ? styles.selected : ''}`}
                    onClick={() => handleEventTypeSelect(type)}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.configSection}>
          <h3>Time Zone</h3>
          <div ref={timeStandardRef} className={styles.eventTypeContainer}>
            <p 
              className={`${styles.configLabel} ${styles.eventTypeLabel}`}
              onClick={() => setShowTimeStandardDropdown(!showTimeStandardDropdown)}
            >
              {selectedTimeStandard}
              <HiChevronDown className={styles.dropdownIcon} />
            </p>
            {showTimeStandardDropdown && (
              <div className={styles.eventTypeDropdown}>
                {indianTimeStandards.map(standard => (
                  <div 
                    key={standard} 
                    className={`${styles.eventTypeOption} ${selectedTimeStandard === standard ? styles.selected : ''}`}
                    onClick={() => handleTimeStandardSelect(standard)}
                  >
                    {standard}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.weeklyHours}>
        <h3>Weekly hours</h3>

        {days.map(day => {
          const isAvailable = watch(`${day.id}.isAvailable`);
          
          return (
            <div key={day.id} className={styles.dayRow} data-day-id={day.id}>
              <div className={styles.dayCheck}>
                <Controller
                  name={`${day.id}.isAvailable`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id={day.id}
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (!e.target.checked) {
                          // Reset times when marking as unavailable
                          setDayTimeSlots(prev => ({
                            ...prev,
                            [day.id]: [{ startTime: '09:00', endTime: '17:00' }]
                          }));
                        }
                      }}
                      className={styles.checkbox}
                    />
                  )}
                />
                <label htmlFor={day.id}>{day.label}</label>
              </div>
              
              <div className={styles.dayContent}>
                {!isAvailable ? (
                  <div className={styles.unavailable}>Unavailable</div>
                ) : (
                  <div className={styles.timeSlots}>
                    {dayTimeSlots[day.id].map((slot, index) => (
                      <div key={`${day.id}-slot-${index}`} className={styles.timeSlot}>
                        <select 
                          className={styles.timeInput}
                          value={slot.startTime}
                          onChange={(e) => {
                            const newSlots = [...dayTimeSlots[day.id]];
                            newSlots[index].startTime = e.target.value;
                            setDayTimeSlots(prev => ({ ...prev, [day.id]: newSlots }));
                            
                            // Update the form state
                            setValue(`${day.id}.timeSlots`, newSlots);
                          }}
                        >
                          {timeSlots.map(time => (
                            <option key={`${day.id}-start-${index}-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <span className={styles.timeSeparator}>-</span>
                        <select 
                          className={styles.timeInput}
                          value={slot.endTime}
                          onChange={(e) => {
                            const newSlots = [...dayTimeSlots[day.id]];
                            newSlots[index].endTime = e.target.value;
                            setDayTimeSlots(prev => ({ ...prev, [day.id]: newSlots }));
                            
                            // Update the form state
                            setValue(`${day.id}.timeSlots`, newSlots);
                          }}
                        >
                          {timeSlots.map(time => (
                            <option key={`${day.id}-end-${index}-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className={styles.removeButton}
                          onClick={() => removeTimeSlot(day.id, index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={styles.dayActions}>
                <button 
                  type="button" 
                  className={styles.addButton}
                  onClick={() => addTimeSlot(day.id)}
                  disabled={!isAvailable}
                >
                  +
                </button>
                <button 
                  type="button" 
                  className={`${styles.copyButton} ${copySource === day.id ? styles.activeCopy : ''}`}
                  aria-label={copySource === day.id ? "Selected for copy" : "Copy schedule"}
                  title={copySource === day.id ? "Selected for copy" : "Copy schedule"}
                  onClick={() => copyTimeSlots(day.id)}
                >
                  {copySource === day.id ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.checkIcon}>
                      <path d="M6.5 12L2 7.5L3.5 6L6.5 9L12.5 3L14 4.5L6.5 12Z" fill="currentColor"/>
                    </svg>
                  ) : (
                    <img src={CopyIcon} alt="Copy" className={styles.copyIcon} />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        <div className={styles.formActions}>
          <button 
            type="button"
            className={styles.submitButton}
            disabled={loading}
            onClick={() => {
              // Manual direct call to onSubmit with form values
              if (!loading) {
                try {
                  // Get current form values
                  const formValues = getValues();
                  
                  // Double check that we have form values
                  if (!formValues || Object.keys(formValues).length === 0) {
                    console.error('No form values found');
                    errorToast('Unable to submit form: No form data available');
                    return;
                  }
                  
                  console.log('Submitting availability form with values:', formValues);
                  onSubmit(formValues);
                } catch (error) {
                  console.error('Error submitting form:', error);
                  errorToast('Failed to submit form: ' + (error.message || 'Unknown error'));
                }
              }
            }}
          >
            {loading ? 'Updating...' : 'Update Availability'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityForm; 
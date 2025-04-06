import React, { useState, useEffect, Suspense } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { MdList } from 'react-icons/md';
import styles from './AvailabilityPage.module.css';
import CalendarView from './CalendarView';
import AvailabilityForm from './AvailabilityForm';
import { getUserAvailability, getTimezone, getEventType } from '../../services/availabilityService';
import { defaultTimeGap } from './data.jsx';
import { toast } from 'react-toastify';

const AvailabilityPage = () => {
    const [activeTab, setActiveTab] = useState('availability');
    const [availabilityData, setAvailabilityData] = useState(null);
    const [selectedEventType, setSelectedEventType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch availability data using the new service
                const data = await getUserAvailability();
                
                // Get additional preferences
                try {
                    // Try to get timezone preference
                    const timezoneResponse = await getTimezone();
                    if (timezoneResponse.success && timezoneResponse.data && timezoneResponse.data.timezone) {
                        // Store timezone preference if available
                        data.timezone = timezoneResponse.data.timezone;
                    }
                    
                    // Try to get event type preference
                    const eventTypeResponse = await getEventType();
                    if (eventTypeResponse.success && eventTypeResponse.data && eventTypeResponse.data.eventType) {
                        // Store event type preference if available
                        data.eventType = eventTypeResponse.data.eventType;
                        // Also store in component state to prevent refresh when changing tabs
                        setSelectedEventType(eventTypeResponse.data.eventType);
                    }
                } catch (prefError) {
                    console.warn('Error fetching preferences:', prefError);
                    // Continue with available data
                }
                
                setAvailabilityData(data);
            } catch (error) {
                console.error('Error fetching availability', error);
                setError(error.message || 'Failed to load availability settings');
                toast.error('Failed to load availability settings');
                
                // Set default data if there's an error
                const defaultData = {
                    monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
                    tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
                    wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
                    thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
                    friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
                    saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
                    sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
                    timeGap: defaultTimeGap,
                    timezone: 'Indian Standard Time (IST)',
                    eventType: 'Meeting'
                };
                
                setAvailabilityData(defaultData);
                setSelectedEventType(defaultData.eventType);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAvailability();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };
    
    // Handler for event type updates from AvailabilityForm
    const handleEventTypeChange = (eventType) => {
        setSelectedEventType(eventType);
        // Also update in availabilityData to ensure consistency
        if (availabilityData) {
            setAvailabilityData(prev => ({
                ...prev,
                eventType: eventType
            }));
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className={styles.loadingContainer}>
                    <p>Loading availability settings...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.errorContainer}>
                    <p>Error loading availability: {error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className={styles.submitButton}
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (activeTab === 'availability') {
            return (
                <AvailabilityForm 
                    initialData={availabilityData} 
                    selectedEventType={selectedEventType}
                    onEventTypeChange={handleEventTypeChange}
                />
            );
        } else {
            return <CalendarView />;
        }
    };

    return (
        <div className={styles.availabilityPage}>
            <div className={styles.header}>
                <h1>Availability</h1>
                <p className={styles.description}>Configure times when you are available for bookings</p>
            </div>

            <div className={styles.tabsContainer}>
                <div 
                    className={`${styles.tab} ${activeTab === 'availability' ? styles.activeTab : ''}`} 
                    onClick={() => handleTabChange('availability')}
                >
                    <MdList className={styles.icon} />
                    <span>Availability</span>
                </div>
                <div 
                    className={`${styles.tab} ${activeTab === 'calendar' ? styles.activeTab : ''}`} 
                    onClick={() => handleTabChange('calendar')}
                >
                    <IoCalendarOutline className={styles.icon} />
                    <span>Calendar View</span>
                </div>
            </div>

            <Suspense fallback={<div className={styles.loadingContainer}>Loading availability...</div>}>
                {renderContent()}
            </Suspense>
        </div>
    );
};

export default AvailabilityPage; 
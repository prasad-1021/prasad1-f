import React, { useState, useEffect, useCallback } from 'react';
import styles from './BookingPage.module.css';
import MeetingCard from './MeetingCard';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const BookingPage = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [meetings, setMeetings] = useState({
        upcoming: [],
        pending: [],
        cancelled: [],
        past: []
    });
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user } = useAuth();
    // Initialize authStatus based on current auth state rather than "checking"
    const [authStatus, setAuthStatus] = useState(isAuthenticated ? 'authenticated' : 'checking');
    const { successToast, errorToast } = useToast();

    // Check authentication status
    const checkAuthStatus = useCallback(async () => {
        try {
            // Skip API test if user is already authenticated
            if (isAuthenticated && user && authStatus === 'authenticated') {
                return true;
            }
            
            // First, test basic API connectivity
            try {
                console.log('Testing API connectivity...');
                const testResponse = await api.get('/api/test');
                console.log('API test response:', testResponse.data);
            } catch (testError) {
                console.error('API test failed:', testError);
            }

            // Check if we have user and token
            const token = localStorage.getItem('cnnct_token');
            if (!token) {
                console.error('No authentication token found!');
                setAuthStatus('no-token');
                return false;
            }

            if (!user) {
                console.error('No user found in auth context!');
                setAuthStatus('no-user');
                return false;
            }

            console.log('Auth info:', { 
                userId: user.id, 
                email: user.email, 
                token: token ? `${token.substring(0, 15)}...` : 'none'
            });
            
            setAuthStatus('authenticated');
            return true;
        } catch (error) {
            console.error('Error checking auth status:', error);
            setAuthStatus('error');
            return false;
        }
    }, [user, isAuthenticated, authStatus]);

    // Function to categorize meetings based on status and time
    const categorizeMeeting = useCallback((meeting) => {
        try {
            // Parse the date in DD/MM/YY format properly
            let dateObj;
            let dateStr = meeting.date;
            
            // Handle DD/MM/YY format
            if (dateStr && dateStr.includes('/')) {
                const [day, month, yearShort] = dateStr.split('/');
                // Convert 2-digit year to 4-digit (assuming 20xx for now)
                const year = yearShort.length === 2 ? '20' + yearShort : yearShort;
                dateStr = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
            }
            
            // Parse the time, handling both 12-hour and 24-hour formats
            let timeStr = meeting.endTime;
            if (timeStr) {
                // If it's already in 24-hour format like "15:45"
                if (timeStr.includes(':') && !timeStr.includes(' ')) {
                    // Keep as is
                } 
                // If it has AM/PM format like "3:45 PM"
                else if (timeStr.includes(' ')) {
                    const [time, period] = timeStr.split(' ');
                    const [hours, minutes] = time.split(':');
                    let hour = parseInt(hours, 10);
                    
                    // Convert to 24-hour format
                    if (period.toUpperCase() === 'PM' && hour < 12) {
                        hour += 12;
                    } else if (period.toUpperCase() === 'AM' && hour === 12) {
                        hour = 0;
                    }
                    
                    timeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
                }
            }
            
            // Create the date object with the parsed date and time
            const endTimeStr = `${dateStr}T${timeStr}:00+05:30`; // Add Indian timezone offset
            const endTime = new Date(endTimeStr);
            
            // Get current time in the same timezone
            const now = new Date();
            // Adjust for UTC+5:30 if needed
            const nowInIndia = new Date(now.getTime());
            
            // Compare with the current time
            const isPast = endTime < nowInIndia;
            
            const isHost = meeting.hostId === user.id;

            // Log meeting info for debugging
            console.log('Categorizing meeting:', {
                id: meeting._id || meeting.id,
                title: meeting.title,
                date: meeting.date,
                time: meeting.endTime,
                parsedEndTime: endTime.toString(),
                nowInIndia: nowInIndia.toString(),
                isPast,
                isHost
            });

            if (isPast) {
                return { category: 'past', meeting };
            } 
            
            // Handle rejected/cancelled meetings first - highest priority
            if (meeting.status === 'rejected' || meeting.statusForUser === 'rejected' || 
                meeting.status === 'cancelled') {
                return { 
                    category: 'cancelled', 
                    meeting: {
                        ...meeting, 
                        displayStatus: meeting.status === 'cancelled' ? 'cancelled' : 'rejected'
                    }
                };
            } 
            
            // Then handle pending meetings
            if (meeting.statusForUser === 'pending' && !isHost) {
                return { category: 'pending', meeting };
            } 
            
            // Everything else (accepted or you're the host) goes to upcoming
            return { 
                category: 'upcoming', 
                meeting: {
                    ...meeting, 
                    displayStatus: 'upcoming'
                }
            };
        } catch (e) {
            console.error('Error categorizing meeting:', e, meeting);
            return { category: 'upcoming', meeting }; // Default fallback
        }
    }, [user.id]);

    // Fetch meetings from backend
    const fetchMeetings = useCallback(async () => {
        try {
            const isAuthenticated = await checkAuthStatus();
            if (!isAuthenticated) {
                errorToast('Authentication required. Please login.');
                setLoading(false);
                return;
            }

            setLoading(true);
            console.log('Fetching meetings...');
            const response = await api.get('/api/meetings');
            console.log('Meetings response:', response);
            
            // Handle different API response structures
            const allMeetings = response.data?.data || response.data || [];
            
            if (!Array.isArray(allMeetings)) {
                console.error('Unexpected meetings data format:', allMeetings);
                setMeetings({
                    upcoming: [],
                    pending: [],
                    cancelled: [],
                    past: []
                });
                errorToast('Invalid meetings data format received');
                return;
            }

            console.log('Processing meetings:', allMeetings.length);
            
            // Categorize meetings based on status and time
            const categorizedMeetings = {
                upcoming: [],
                pending: [],
                cancelled: [],
                past: []
            };

            allMeetings.forEach(meeting => {
                const { category, meeting: categorizedMeeting } = categorizeMeeting(meeting);
                categorizedMeetings[category].push(categorizedMeeting);
            });

            console.log('Categorized meetings:', {
                upcoming: categorizedMeetings.upcoming.length,
                pending: categorizedMeetings.pending.length,
                cancelled: categorizedMeetings.cancelled.length,
                past: categorizedMeetings.past.length
            });

            setMeetings(categorizedMeetings);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            console.error('Error details:', error.response?.data);
            errorToast('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    }, [errorToast, checkAuthStatus, user.id, categorizeMeeting]);

    // Set up data fetching
    useEffect(() => {
        // Immediately set authStatus to authenticated if user is already logged in
        if (isAuthenticated && user && user.username) {
            setAuthStatus('authenticated');
        }
        
        fetchMeetings();
        
        // Set up interval to refresh meetings every minute
        const interval = setInterval(fetchMeetings, 60000);
        return () => clearInterval(interval);
    }, [fetchMeetings, isAuthenticated, user]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleAcceptMeeting = async (meetingId, invitationId) => {
        try {
            // Use invitationId if available, otherwise use meetingId
            const endpointId = invitationId || meetingId;
            console.log(`Accepting meeting with ID: ${meetingId}, invitation ID: ${invitationId}, using endpoint ID: ${endpointId}`);
            
            // Make API call to accept the invitation
            const response = await api.put(`/api/meetings/invitation/${endpointId}`, { status: 'accepted' });
            console.log('Accept meeting response:', response.data);
            
            if (response.data?.success) {
                // After accepting a meeting, it should move to upcoming tab
                successToast('Meeting accepted successfully');
                
                // Update meetings data immediately for better UX
                setMeetings(prevMeetings => {
                    // Create updated meeting lists
                    const updatedPending = prevMeetings.pending.filter(m => 
                        (m._id !== meetingId && m.id !== meetingId) || 
                        (invitationId && m.invitationId !== invitationId)
                    );
                    
                    // Find the meeting and move it to upcoming
                    const meetingToMove = prevMeetings.pending.find(m => 
                        (m._id === meetingId || m.id === meetingId) ||
                        (invitationId && m.invitationId === invitationId)
                    );
                    
                    if (meetingToMove) {
                        // Update the meeting's participant list to reflect the user's acceptance
                        const updatedParticipants = Array.isArray(meetingToMove.participants) 
                            ? meetingToMove.participants.map(p => 
                                p.id === user.id || p.email === user.email
                                    ? { ...p, status: 'accepted' }
                                    : p
                            )
                            : [];
                            
                        const updatedMeeting = {
                            ...meetingToMove,
                            status: 'accepted',
                            statusForUser: 'accepted',
                            displayStatus: 'upcoming',
                            participants: updatedParticipants
                        };
                        
                        return {
                            ...prevMeetings,
                            pending: updatedPending,
                            upcoming: [...prevMeetings.upcoming, updatedMeeting]
                        };
                    }
                    
                    // If meeting wasn't in pending, maybe it was already in upcoming and just needs status update
                    const updatedUpcoming = prevMeetings.upcoming.map(m => {
                        if ((m._id === meetingId || m.id === meetingId) || 
                            (invitationId && m.invitationId === invitationId)) {
                            
                            // Update the meeting's participant list
                            const updatedParticipants = Array.isArray(m.participants) 
                                ? m.participants.map(p => 
                                    p.id === user.id || p.email === user.email
                                        ? { ...p, status: 'accepted' }
                                        : p
                                )
                                : [];
                                
                            return {
                                ...m,
                                status: 'accepted',
                                statusForUser: 'accepted',
                                displayStatus: 'upcoming',
                                participants: updatedParticipants
                            };
                        }
                        return m;
                    });
                    
                    return {
                        ...prevMeetings,
                        pending: updatedPending,
                        upcoming: updatedUpcoming
                    };
                });
                
                // Switch to upcoming tab after accepting
                setActiveTab('upcoming');
                
                // Fetch updated data
                await fetchMeetings();
            } else {
                errorToast(response.data?.message || 'Failed to accept meeting');
            }
        } catch (error) {
            console.error('Error accepting meeting:', error);
            console.error('Error details:', error.response?.data);
            errorToast(`Failed to accept meeting: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleRejectMeeting = async (meetingId, invitationId) => {
        try {
            // Use invitationId if available, otherwise use meetingId
            const endpointId = invitationId || meetingId;
            console.log(`Rejecting meeting with ID: ${meetingId}, invitation ID: ${invitationId}, using endpoint ID: ${endpointId}`);
            
            // Make API call to reject the invitation
            const response = await api.put(`/api/meetings/invitation/${endpointId}`, { status: 'rejected' });
            console.log('Reject meeting response:', response.data);
            
            if (response.data?.success) {
                successToast('Meeting rejected successfully');
                
                // Update meetings data immediately for better UX
                setMeetings(prevMeetings => {
                    // Create updated meeting lists - remove from all possible sections and add to cancelled
                    const updatedPending = prevMeetings.pending.filter(m => 
                        (m._id !== meetingId && m.id !== meetingId) || 
                        (invitationId && m.invitationId !== invitationId)
                    );
                    
                    const updatedUpcoming = prevMeetings.upcoming.filter(m => 
                        (m._id !== meetingId && m.id !== meetingId) || 
                        (invitationId && m.invitationId !== invitationId)
                    );
                    
                    // Find the meeting to move to cancelled
                    let meetingToMove = prevMeetings.pending.find(m => 
                        (m._id === meetingId || m.id === meetingId) ||
                        (invitationId && m.invitationId === invitationId)
                    );
                    
                    if (!meetingToMove) {
                        meetingToMove = prevMeetings.upcoming.find(m => 
                            (m._id === meetingId || m.id === meetingId) ||
                            (invitationId && m.invitationId === invitationId)
                        );
                    }
                    
                    if (meetingToMove) {
                        // Update the meeting's participant list to reflect the user's rejection
                        const updatedParticipants = Array.isArray(meetingToMove.participants) 
                            ? meetingToMove.participants.map(p => 
                                p.id === user.id || p.email === user.email
                                    ? { ...p, status: 'rejected' }
                                    : p
                            )
                            : [];
                            
                        const updatedMeeting = {
                            ...meetingToMove,
                            status: 'rejected',
                            statusForUser: 'rejected',
                            displayStatus: 'rejected',
                            participants: updatedParticipants
                        };
                        
                        return {
                            ...prevMeetings,
                            pending: updatedPending,
                            upcoming: updatedUpcoming,
                            cancelled: [...prevMeetings.cancelled, updatedMeeting]
                        };
                    }
                    
                    return {
                        ...prevMeetings,
                        pending: updatedPending,
                        upcoming: updatedUpcoming
                    };
                });
                
                // Switch to cancelled tab after rejecting
                setActiveTab('cancelled');
                
                // Fetch updated data
                await fetchMeetings();
            } else {
                errorToast(response.data?.message || 'Failed to reject meeting');
            }
        } catch (error) {
            console.error('Error rejecting meeting:', error);
            console.error('Error details:', error.response?.data);
            errorToast(`Failed to reject meeting: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleCancelMeeting = async (meetingId) => {
        try {
            await api.put(`/api/meetings/${meetingId}`, { status: 'cancelled' });
            await fetchMeetings();
            successToast('Meeting cancelled successfully');
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            errorToast('Failed to cancel meeting');
        }
    };

    return (
        <div className={styles.bookingPage}>
            <div className={styles.header}>
                <h1>Bookings</h1>
                <p className={styles.description}>Manage your upcoming and past meetings</p>
                {authStatus !== 'authenticated' && authStatus !== 'checking' && (
                    <div className={styles.authWarning}>
                        <p>Authentication status: {authStatus}</p>
                        <p>Please login again if you're experiencing issues.</p>
                    </div>
                )}
            </div>

            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                    {['upcoming', 'pending', 'cancelled', 'past'].map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            <span className={styles.tabText}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.meetingsContainer}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        Loading meetings...
                    </div>
                ) : meetings[activeTab].length > 0 ? (
                    meetings[activeTab].map((meeting) => (
                        <MeetingCard
                            key={meeting._id || meeting.id}
                            title={meeting.title || 'Untitled Meeting'}
                            date={meeting.date}
                            startTime={meeting.startTime || (meeting.time && meeting.period ? `${meeting.time} ${meeting.period}` : '')}
                            endTime={meeting.endTime || meeting.displayEndTime}
                            participants={meeting.participants || meeting.invitees || []}
                            status={meeting.status}
                            statusForUser={meeting.statusForUser}
                            onAccept={() => handleAcceptMeeting(meeting._id || meeting.id, meeting.invitationId)}
                            onReject={() => handleRejectMeeting(meeting._id || meeting.id, meeting.invitationId)}
                            onCancel={() => handleCancelMeeting(meeting._id || meeting.id)}
                            showActions={activeTab === 'pending'}
                            isPast={activeTab === 'past'}
                            description={meeting.description}
                            meetingLink={meeting.meetingLink}
                            displayStatus={meeting.displayStatus || activeTab}
                            meetingId={meeting._id || meeting.id}
                            invitationId={meeting.invitationId}
                        />
                    ))
                ) : (
                    <div className={styles.noMeetings}>
                        No {activeTab} meetings found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage; 
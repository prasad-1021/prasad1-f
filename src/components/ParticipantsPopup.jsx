import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styles from './ParticipantsPopup.module.css';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ParticipantsPopup = ({ onClose, participants, meetingId, onUpdateStatus }) => {
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Show accepted users first, hide rejected ones
  useEffect(() => {
    if (Array.isArray(participants)) {
      const filtered = participants
        .filter(p => p.status !== 'rejected')
        .sort((a, b) => {
          if (a.status === 'accepted' && b.status !== 'accepted') return -1;
          if (a.status !== 'accepted' && b.status === 'accepted') return 1;
          return 0;
        });
      setFilteredParticipants(filtered);
    }
  }, [participants]);

  // Accept or reject meeting
  const handleUpdateMyStatus = useCallback(async (newStatus) => {
    if (!meetingId || !user?.id) {
      errorToast('Unable to update status: Missing meeting ID or user information');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Updating status to ${newStatus} for meeting ${meetingId}`);
      
      // Call API
      const response = await api.put(`/api/meetings/invitation/${meetingId}`, { 
        status: newStatus
      });
      
      if (response.data?.success) {
        // Update UI
        setFilteredParticipants(prev => 
          prev.map(p => (p.id === user.id || p.email === user.email) ? 
            { ...p, status: newStatus } : p)
        );
        
        // Update parent count
        if (typeof onUpdateStatus === 'function') {
          onUpdateStatus(user.id, newStatus);
          
          // Remove from list if rejected
          if (newStatus === 'rejected') {
            setFilteredParticipants(prev => 
              prev.filter(p => p.id !== user.id && p.email !== user.email)
            );
          }
        }
        
        successToast(`You have ${newStatus === 'accepted' ? 'accepted' : 'rejected'} the meeting`);
        
        // For rejections
        if (newStatus === 'rejected') {
          // Refresh page after delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
          setTimeout(() => onClose(), 1000);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update your status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      errorToast(`Failed to update status: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }, [meetingId, user, successToast, errorToast, onClose, onUpdateStatus]);
  
  // Find current user
  const currentUserParticipant = filteredParticipants.find(
    p => p.id === user?.id || p.email === user?.email
  );
  
  // Check if user already responded
  const hasResponded = currentUserParticipant && 
    (currentUserParticipant.status === 'accepted' || currentUserParticipant.status === 'rejected');
  
  const content = (
    <div className={styles.popupOverlay} onClick={(e) => {
      // Close when clicking overlay
      if (e.target.className === styles.popupOverlay) {
        onClose();
      }
    }}>
      <div className={styles.popup}>
        <button className={styles.closeButton} onClick={onClose}>
          <IoClose />
        </button>
        <div className={styles.popupContent}>
          <div className={styles.participantSection}>
            <div className={styles.participantLabel}>
              <h2 className={styles.labelText}>
                Participant <span className={styles.amount}>({filteredParticipants.length})</span>
              </h2>
            </div>

            <div className={styles.participantsList}>
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant, index) => (
                  <div key={participant.id || index} className={styles.participantItem}>
                    <div className={styles.participantInfo}>
                      <div className={styles.profile}>
                        {participant.profileImage ? (
                          <img 
                            src={participant.profileImage} 
                            alt={participant.name} 
                            className={styles.profileImage} 
                          />
                        ) : (
                          <div className={styles.profileInitial}>
                            {participant.name && participant.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className={styles.participantName}>
                        {participant.name}
                        {(participant.id === user?.id || participant.email === user?.email) && 
                          <span className={styles.youLabel}> (You)</span>
                        }
                      </span>
                    </div>
                    
                    <div className={styles.statusCheckbox}>
                      <input 
                        type="checkbox" 
                        checked={participant.status === 'accepted'} 
                        readOnly 
                        className={styles.checkbox} 
                        data-status={participant.status}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noParticipants}>
                  No participants available for this meeting.
                </div>
              )}
            </div>
            
            {/* Accept/Reject buttons at the bottom for current user */}
            {!hasResponded && (
              <div className={styles.actionButtonsBottom}>
                <button 
                  className={styles.rejectButton}
                  onClick={() => handleUpdateMyStatus('rejected')}
                  disabled={loading}
                  data-testid="reject-button"
                >
                  <FaTimes />
                  <span>Reject</span>
                </button>
                <button 
                  className={styles.acceptButton}
                  onClick={() => handleUpdateMyStatus('accepted')}
                  disabled={loading}
                  data-testid="accept-button"
                >
                  <FaCheck />
                  <span>Accept</span>
                </button>
              </div>
            )}
            
            {/* Show status message if user has already responded */}
            {hasResponded && (
              <div className={styles.statusMessage}>
                You have {currentUserParticipant?.status === 'accepted' ? 'accepted' : 'rejected'} this meeting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render at body level using portal
  return ReactDOM.createPortal(
    content,
    document.body
  );
};

export default ParticipantsPopup; 
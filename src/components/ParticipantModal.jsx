import React from 'react';
import './ParticipantModal.css';
import { IoClose } from 'react-icons/io5';
import { ProfileImagePlaceholder } from '../assets/ImagePlaceholders.jsx';
import { FaTimes, FaCheck } from 'react-icons/fa';

export default function ParticipantModal({ participants, onClose, onAccept, onReject }) {
  // Prevent scroll on body when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <IoClose />
        </button>
        
        <div className="modal-header">
          <h3 className="modal-title">Participant <span className="participant-count">({participants.length})</span></h3>
          
          <div className="action-buttons">
            <button 
              className="reject-button"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
            >
              <FaTimes />
              <span>Reject</span>
            </button>
            <button 
              className="accept-button"
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
            >
              <FaCheck />
              <span>Accept</span>
            </button>
          </div>
        </div>
        
        <div className="participants-list">
          {participants.length > 0 ? (
            participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <div className="participant-info">
                  <div className="profile">
                    <img 
                      src={participant.profileImage || ProfileImagePlaceholder} 
                      alt={participant.name} 
                      className="profile-image" 
                    />
                  </div>
                  <span className="participant-name">{participant.name}</span>
                </div>
                <div className="status-checkbox">
                  <input 
                    type="checkbox" 
                    checked={participant.status === 'accepted'} 
                    readOnly 
                    className="checkbox" 
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="no-participants">
              No participants have been invited to this event yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
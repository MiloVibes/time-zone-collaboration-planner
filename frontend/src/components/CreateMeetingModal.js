import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

Modal.setAppElement('#root');

// NEW: Define custom styles to fix transparency and positioning
const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000 // Ensure overlay is on top
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      border: 'none',
      background: 'white',
      width: '90%',
      maxWidth: '600px',
      padding: '2rem',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    },
  };

const CreateMeetingModal = ({ isOpen, onRequestClose, onMeetingCreated }) => {
    // State for the form fields
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('10:00'); 
    const [duration, setDuration] = useState(60);
    
    // State for user invitations and suggestions
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    
    // State for messages
    const [error, setError] = useState('');

    const hours = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2).toString().padStart(2, '0');
        const minute = (i % 2 === 0) ? '00' : '30';
        return `${hour}:${minute}`;
    });

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('10:00');
            setDuration(60);
            setSelectedUsers([]);
            setSuggestions([]);
            setError('');
            
            axios.get('/api/users')
                .then(res => setUsers(res.data))
                .catch(err => console.error("Could not fetch users", err));
        }
    }, [isOpen]);

    const handleFindTimes = async () => {
        setError('');
        setSuggestions([]);
        try {
            const response = await axios.post('/api/suggest-times', {
                participant_ids: selectedUsers,
                date: date,
                duration: duration,
            });
            if (response.data.length === 0) {
                setError('No optimal time slots found for everyone. Please try another date or duration.');
            }
            setSuggestions(response.data);
        } catch (err) {
            setError('Could not fetch suggestions.');
        }
    };
    
    const handleScheduleMeeting = async (meetingStartTime) => {
        if (!title) {
            setError('Please enter a meeting title.');
            return;
        }

        const start = new Date(meetingStartTime);
        const end = new Date(start.getTime() + duration * 60000);

        try {
            await axios.post('/api/meetings', {
                title,
                start: start.toISOString(),
                end: end.toISOString(),
                participant_ids: selectedUsers,
            });
            onMeetingCreated();
            onRequestClose();
        } catch (err) {
            setError('Failed to schedule meeting.');
        }
    };

    const handleManualSchedule = () => {
        // Combine selected date and time into a UTC string
        const manualStartTime = new Date(`${date}T${startTime}:00`).toISOString();
        handleScheduleMeeting(manualStartTime);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose} 
            style={customStyles} // Apply the new custom styles here
        >
            <h2>Create New Meeting</h2>
            {error && <p className="error">{error}</p>}

            <div className="form-group">
                <label>Meeting Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {/* UPDATED: Improved layout for date/time inputs */}
            <div className="form-group-row">
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Start Time</label>
                    <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Duration (mins)</label>
                    <input type="number" value={duration} step="15" min="15" onChange={(e) => setDuration(e.target.value)} />
                </div>
            </div>

            <button onClick={handleManualSchedule} className="btn-primary" style={{width: '100%', marginBottom: '1rem'}}>
                Schedule Meeting
            </button>

            <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '1.5rem 0'}} />

            <div className="form-group">
                <label>Find Optimal Time with Others</label>
                <p style={{fontSize: '0.9rem', color: '#666', marginTop: '-1rem'}}>(Optional) Select users to find best times.</p>
                <select multiple value={selectedUsers} onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))} className="multi-select">
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
            </div>
            
            <button onClick={handleFindTimes} className="btn-secondary" disabled={selectedUsers.length === 0}>
                Find Optimal Times For Group
            </button>
            
            {suggestions.length > 0 && (
                <div className="suggestions">
                    <h4>Suggested Times (in your local time):</h4>
                    <ul>
                        {suggestions.map(slot => (
                            <li key={slot}>
                                <span>{format(parseISO(slot), 'MMM d, h:mm a')}</span>
                                <button onClick={() => handleScheduleMeeting(slot)} className="btn-primary">Schedule This Slot</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Modal>
    );
};

export default CreateMeetingModal;


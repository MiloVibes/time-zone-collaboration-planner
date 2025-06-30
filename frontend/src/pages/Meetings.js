import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import CreateMeetingModal from '../components/CreateMeetingModal';

const locales = {
    'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Meetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMeetings = useCallback(async () => {
        try {
            const response = await axios.get('/api/meetings');
            const formattedMeetings = response.data.map(meeting => ({
                ...meeting,
                start: new Date(meeting.start),
                end: new Date(meeting.end),
            }));
            setMeetings(formattedMeetings);
        } catch (error) {
            console.error("Failed to fetch meetings", error);
        }
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const handleMeetingCreated = () => {
        fetchMeetings(); 
    };

    // NEW: Handler for clicking and deleting a meeting
    const handleSelectEvent = useCallback(async (event) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the meeting: "${event.title}"?`);
        if (confirmDelete) {
            try {
                await axios.delete(`/api/meetings/${event.id}`);
                // Refresh the meetings list after deletion
                fetchMeetings(); 
            } catch (error) {
                // You can add more robust error handling here, e.g., a toast notification
                if (error.response?.status === 403) {
                    alert("You can only delete meetings that you have created.");
                } else {
                    alert("Failed to delete meeting.");
                }
            }
        }
    }, [fetchMeetings]);

    return (
        <div>
            <div className="page-header">
                <h1>Meetings</h1>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Create New Meeting</button>
            </div>
            <div style={{ height: '70vh', backgroundColor: 'white', padding: '1rem', borderRadius: '8px' }}>
                <Calendar
                    localizer={localizer}
                    events={meetings}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={handleSelectEvent} // Add the event handler here
                />
            </div>
            <CreateMeetingModal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                onMeetingCreated={handleMeetingCreated}
            />
        </div>
    );
};

export default Meetings;

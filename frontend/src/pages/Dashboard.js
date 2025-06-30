import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { format, formatInTimeZone } from 'date-fns-tz';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [localTime, setLocalTime] = useState(new Date());

    useEffect(() => {
        // USE RELATIVE PATH
        axios.get('/api/meetings/upcoming')
            .then(response => {
                setUpcomingMeetings(response.data);
            })
            .catch(error => {
                console.error("Failed to fetch upcoming meetings", error);
            });
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setLocalTime(new Date());
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const userTimeZone = user?.timezone || 'UTC';

    return (
        <div>
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <div className="local-time-display">
                    <p>{formatInTimeZone(localTime, userTimeZone, 'eeee, MMMM do yyyy')}</p>
                    <p className="time">{formatInTimeZone(localTime, userTimeZone, 'h:mm:ss a')}</p>
                    <p className="timezone-name">({userTimeZone.replace(/_/g, ' ')})</p>
                </div>
            </div>
            <h2>Welcome, {user?.username}!</h2>
            <div className="dashboard-actions">
                <Link to="/meetings" className="btn-primary">+ Create New Meeting</Link>
                <Link to="/meetings" className="btn-secondary">View Full Calendar</Link>
            </div>
            <div className="upcoming-meetings-panel">
                <h3>Your Next 5 Upcoming Meetings</h3>
                {upcomingMeetings.length > 0 ? (
                    <ul className="meeting-list">
                        {upcomingMeetings.map(meeting => (
                             <li key={meeting.id}>
                                <div className="meeting-time">
                                    <div className="month">{formatInTimeZone(new Date(meeting.start), userTimeZone, 'MMM')}</div>
                                    <div className="day">{formatInTimeZone(new Date(meeting.start), userTimeZone, 'dd')}</div>
                                </div>
                                <div className="meeting-details">
                                    <p className="title">{meeting.title}</p>
                                    <p className="time-range">
                                        {formatInTimeZone(new Date(meeting.start), userTimeZone, 'h:mm a')} - {formatInTimeZone(new Date(meeting.end), userTimeZone, 'h:mm a')}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>You have no upcoming meetings. Time to schedule something!</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

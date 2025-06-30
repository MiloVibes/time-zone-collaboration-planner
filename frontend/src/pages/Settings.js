import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
    const { user, setUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        username: '', timezone: 'UTC', working_hours_start: '09:00', working_hours_end: '17:00',
    });
    const [timezones, setTimezones] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const hours = Array.from({ length: 24 }, (_, i) => (`${i.toString().padStart(2, '0')}:00`));

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                timezone: user.timezone,
                working_hours_start: user.working_hours_start || '09:00',
                working_hours_end: user.working_hours_end || '17:00',
            });
        }
    }, [user?.id]);

    useEffect(() => {
        // USE RELATIVE PATH
        axios.get('/api/timezones')
            .then(res => setTimezones(res.data))
            .catch(err => console.error("Could not fetch timezones", err));
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            // USE RELATIVE PATH
            const response = await axios.put('/api/profile', formData);
            setMessage(response.data.message);
            setUser(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update settings.');
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div>
            <h1>Settings</h1>
            <form onSubmit={handleSubmit} className="settings-form">
                {message && <p className="success">{message}</p>}
                {error && <p className="error">{error}</p>}
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={user.email} disabled />
                    <small>Email address cannot be changed.</small>
                </div>
                <div className="form-group">
                    <label htmlFor="timezone">Timezone</label>
                    <select id="timezone" name="timezone" value={formData.timezone} onChange={handleChange}>
                        {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div className="form-group-row">
                    <div className="form-group">
                        <label htmlFor="working_hours_start">Working Hours Start</label>
                        <select id="working_hours_start" name="working_hours_start" value={formData.working_hours_start} onChange={handleChange}>
                            {hours.map(h => <option key={`start-${h}`} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="working_hours_end">Working Hours End</label>
                        <select id="working_hours_end" name="working_hours_end" value={formData.working_hours_end} onChange={handleChange}>
                            {hours.map(h => <option key={`end-${h}`} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>
                <button type="submit" className="btn-primary">Save Changes</button>
            </form>
        </div>
    );
};

export default Settings;
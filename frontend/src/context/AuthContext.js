import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkLoggedIn = async () => {
        try {
            // USE RELATIVE PATH
            const response = await axios.get('/api/check_session');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        // USE RELATIVE PATH
        const response = await axios.post('/api/login', { email, password });
        setUser(response.data.user);
    };

    const register = async (username, email, password) => {
        // USE RELATIVE PATH
        await axios.post('/api/register', { username, email, password });
    };

    const logout = async () => {
        // USE RELATIVE PATH
        await axios.post('/api/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
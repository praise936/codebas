// frontend/my-react-app/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await authAPI.getProfile();
                    // support APIs that return { user: {...} } or the user object directly
                    setUser(response.data?.user || response.data || null);
                } catch (error) {
                    console.error('Failed to load user', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            const { access, refresh, user: userObj } = response.data;

            if (access) {
                localStorage.setItem('access_token', access);
            }
            if (refresh) {
                localStorage.setItem('refresh_token', refresh);
            }

            setToken(access);
            setUser(userObj || response.data?.user || null);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || error.response?.data || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { access, refresh, user: userObj } = response.data;

            if (access) {
                localStorage.setItem('access_token', access);
            }
            // FIX: store the refresh token (previously the code removed it by mistake)
            if (refresh) {
                localStorage.setItem('refresh_token', refresh);
            }

            setToken(access);
            setUser(userObj || response.data?.user || null);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || 'Registration failed'
            };
        }
    };

    const logout = () => {
        authAPI.logout();
        setToken(null);
        setUser(null);
        // ensure redirected to login
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};


import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../api/client';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
                // Optionally verify token with backend here
                try {
                    const response = await client.get<User>('/users/me');
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                } catch (error) {
                    console.error("Token verification failed", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        try {
            const response = await client.post<AuthResponse>('/auth/login', data);
            const { accessToken, user } = response.data;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            toast.success('Welcome back!');
        } catch (error: any) {
            console.error('Login failed', error);
            toast.error(error.response?.data?.message || 'Login failed');
            throw error;
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            await client.post('/auth/register', data);
            toast.success('Registration successful! Please login.');
        } catch (error: any) {
            console.error('Registration failed', error);
            toast.error(error.response?.data?.message || 'Registration failed');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

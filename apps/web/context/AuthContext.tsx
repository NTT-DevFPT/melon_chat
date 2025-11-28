import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { client } from '@/src/api/client';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserStatus } from '../types';
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

    const updateRemoteStatus = useCallback(async (status: UserStatus) => {
        try {
            await client.put('/users/status', { status });
            setUser(prev => (prev ? { ...prev, status } : prev));
        } catch (error) {
            console.error('Failed to update status', error);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
                try {
                    const response = await client.get<User>('/users/me');
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                    await updateRemoteStatus(UserStatus.ONLINE);
                } catch (error) {
                    console.error("Token verification failed", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [updateRemoteStatus]);

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
        const perform = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                await updateRemoteStatus(UserStatus.OFFLINE);
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            window.location.href = '/login';
        };
        perform();
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

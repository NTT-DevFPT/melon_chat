import { create } from 'zustand';
import { client } from '@/src/api/client';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserStatus,
} from '../../types';
import { toast } from 'react-hot-toast';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateUserStatus: (status: UserStatus) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  updateUserStatus: async (status: UserStatus) => {
    try {
      await client.put('/users/status', { status });
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, status } });
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      const user = JSON.parse(savedUser);
      set({ user, isAuthenticated: true });

      try {
        const response = await client.get<User>('/users/me');
        set({ user: response.data, isAuthenticated: true });
        localStorage.setItem('user', JSON.stringify(response.data));
        await get().updateUserStatus(UserStatus.ONLINE);
      } catch (error) {
        console.error('Token verification failed', error);
        get().logout();
      }
    }
    set({ isLoading: false });
  },

  login: async (data: LoginRequest) => {
    try {
      const response = await client.post<AuthResponse>('/auth/login', data);
      const { accessToken, user } = response.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      await get().updateUserStatus(UserStatus.ONLINE);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login failed', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed';

      // Show specific error messages
      if (
        errorMessage.includes('Account does not exist') ||
        errorMessage.includes('not found')
      ) {
        toast.error('Account does not exist. Please check your username.');
      } else if (
        errorMessage.includes('Incorrect password') ||
        errorMessage.includes('Bad credentials')
      ) {
        toast.error('Incorrect password. Please try again.');
      } else if (errorMessage.includes('inactive')) {
        toast.error('Your account is inactive. Please contact support.');
      } else {
        toast.error(errorMessage);
      }
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      await client.post('/auth/register', data);
      toast.success(
        'Registration successful! Please check your email for OTP code.'
      );
    } catch (error: any) {
      console.error('Registration failed', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Registration failed';

      // Show specific error messages
      if (
        errorMessage.includes('username') &&
        errorMessage.includes('already')
      ) {
        toast.error('Username already exists. Please choose another.');
      } else if (
        errorMessage.includes('email') &&
        errorMessage.includes('already')
      ) {
        toast.error(
          'Email already registered. Please use another email or login.'
        );
      } else {
        toast.error(errorMessage);
      }
      throw error;
    }
  },

  logout: () => {
    const perform = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await get().updateUserStatus(UserStatus.OFFLINE);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
      window.location.href = '/login';
    };
    perform();
  },
}));

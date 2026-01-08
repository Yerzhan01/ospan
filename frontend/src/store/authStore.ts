import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginResponse } from '@/types/auth';
import api from '@/lib/api';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: true, // Initial load

            login: async (email, password) => {
                try {
                    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });

                    if (data.success && data.data) {
                        set({
                            user: data.data.user,
                            accessToken: data.data.tokens.accessToken,
                            isAuthenticated: true,
                        });

                        // Sync with localStorage for api.ts interceptor
                        localStorage.setItem('accessToken', data.data.tokens.accessToken);
                    } else {
                        throw new Error('Login failed');
                    }
                } catch (error) {
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout failed', error);
                } finally {
                    set({ user: null, accessToken: null, isAuthenticated: false });
                    localStorage.removeItem('accessToken');
                    // Optional: Redirect to login handled by component/guard
                }
            },

            checkAuth: async () => {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false, user: null });
                    return;
                }

                try {
                    set({ isLoading: true });
                    // Verify token and get user
                    const { data } = await api.get('/auth/me');

                    if (data.success && data.data) {
                        set({ user: data.data, isAuthenticated: true, accessToken: token });
                    }
                } catch (error) {
                    // If checkAuth fails even after refresh attempt
                    set({ user: null, accessToken: null, isAuthenticated: false });
                    localStorage.removeItem('accessToken');
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
        }
    )
);

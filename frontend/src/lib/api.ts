import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Create separate instance for auth to avoid circular interceptor loops
const authApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // For cookies
});

// Request Interceptor: Add Access Token
api.interceptors.request.use((config) => {
    // We'll let Zustand store handle setting the token in headers mostly,
    // but if we need to grab it from localStorage directly as backup:
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle 401 & Refresh
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                // Use authApi to bypass interceptors
                const { data } = await authApi.post('/auth/refresh');

                // Assuming backend sets httpOnly cookie for refresh token, 
                // but also returns new access token in body
                const newAccessToken = data.data.tokens.accessToken;

                // Update localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', newAccessToken);
                }

                // Update header for repeat request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (token expired or invalid)
                // Redirect to login or let store handle logout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user-storage'); // Clear zustand persistence if needed
                    window.location.href = '/auth/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

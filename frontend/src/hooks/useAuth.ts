import { useAuthStore } from '@/store/authStore';

export function useAuth() {
    const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useAuthStore();

    // Note: checkAuth is NOT called here anymore
    // It's only called in AuthGuard on initial mount
    // This prevents infinite re-render loops

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
    };
}

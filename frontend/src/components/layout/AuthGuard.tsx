'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const hasChecked = useRef(false);

    // Check auth only once on mount
    useEffect(() => {
        if (!hasChecked.current) {
            hasChecked.current = true;
            checkAuth();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Redirect if not authenticated after check completes
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center space-y-4 flex-col">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

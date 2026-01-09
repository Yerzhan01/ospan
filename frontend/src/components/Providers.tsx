'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null) {
        const err = error as { response?: { data?: { message?: string } }, message?: string };
        return err.response?.data?.message || err.message || 'Произошла ошибка';
    }
    return 'Произошла неизвестная ошибка';
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error: unknown) => {
                            // Don't retry on 4xx client errors
                            const err = error as { response?: { status?: number } };
                            if (err?.response?.status && err.response.status >= 400 && err.response.status < 500) {
                                return false;
                            }
                            // Retry up to 2 times for other errors
                            return failureCount < 2;
                        },
                    },
                    mutations: {
                        onError: (error) => {
                            toast.error(getErrorMessage(error));
                        },
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" richColors closeButton />
        </QueryClientProvider>
    );
}


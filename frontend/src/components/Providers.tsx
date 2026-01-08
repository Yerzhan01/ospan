'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error: any) => {
                            // Don't retry on 4xx client errors
                            if (error?.response?.status >= 400 && error?.response?.status < 500) {
                                return false;
                            }
                            // Retry up to 2 times for other errors
                            return failureCount < 2;
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

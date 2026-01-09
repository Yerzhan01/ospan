'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { WhatsAppIntegrationCard } from '@/components/integrations/WhatsAppIntegrationCard';
import { AmoCRMIntegrationCard } from '@/components/integrations/AmoCRMIntegrationCard';
import { OpenAIIntegrationCard } from '@/components/integrations/OpenAIIntegrationCard';

export default function IntegrationsPage() {
    const searchParams = useSearchParams();

    // Handle OAuth callback parameters
    useEffect(() => {
        const amoSuccess = searchParams.get('amo_success');
        const amoError = searchParams.get('amo_error');

        if (amoSuccess === 'true') {
            toast.success('AmoCRM успешно подключён!');
            // Clean URL
            window.history.replaceState({}, '', '/settings/integrations');
        } else if (amoError === 'true') {
            const errorMsg = searchParams.get('message') || 'Ошибка подключения AmoCRM';
            toast.error(errorMsg);
            window.history.replaceState({}, '', '/settings/integrations');
        }
    }, [searchParams]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Интеграции</h2>
                    <p className="text-muted-foreground">
                        Управление подключениями к внешним сервисам и API.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <WhatsAppIntegrationCard />
                <AmoCRMIntegrationCard />
                <OpenAIIntegrationCard />
            </div>
        </div>
    );
}

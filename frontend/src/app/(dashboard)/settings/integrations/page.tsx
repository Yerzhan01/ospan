'use client';

import { WhatsAppIntegrationCard } from '@/components/integrations/WhatsAppIntegrationCard';
import { AmoCRMIntegrationCard } from '@/components/integrations/AmoCRMIntegrationCard';

export default function IntegrationsPage() {
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
            </div>
        </div>
    );
}

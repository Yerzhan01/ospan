'use client';

import { useState } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertCard } from '@/components/alerts/AlertCard';
import { AlertStatus } from '@/types/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function AlertsPage() {
    const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('NEW');
    const { data: alerts, isLoading } = useAlerts({
        status: statusFilter === 'all' ? undefined : statusFilter
    });

    const groupedAlerts = (alerts || []).reduce((acc, alert) => {
        const date = new Date(alert.createdAt);
        const key = isToday(date)
            ? 'Сегодня'
            : isYesterday(date)
                ? 'Вчера'
                : format(date, 'd MMMM', { locale: ru });

        if (!acc[key]) acc[key] = [];
        acc[key].push(alert);
        return acc;
    }, {} as Record<string, typeof alerts>);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Алёрты</h1>
                <p className="text-muted-foreground">Управление рисками и уведомлениями пациентов.</p>
            </div>

            <Tabs defaultValue="NEW" className="w-full" onValueChange={(val) => setStatusFilter(val as any)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="NEW">Новые</TabsTrigger>
                    <TabsTrigger value="IN_PROGRESS">В работе</TabsTrigger>
                    <TabsTrigger value="RESOLVED">Закрытые</TabsTrigger>
                    <TabsTrigger value="all">Все</TabsTrigger>
                </TabsList>

                <div className="mt-6 space-y-8">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                        </div>
                    ) : (Object.entries(groupedAlerts).length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Нет алёртов в этой категории
                        </div>
                    ) : (
                        Object.entries(groupedAlerts).map(([date, groupAlerts]) => (
                            <div key={date} className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-muted/20 backdrop-blur-sm p-2 rounded-md">
                                    {date}
                                </h3>
                                <div className="space-y-4">
                                    {groupAlerts?.map(alert => (
                                        <AlertCard key={alert.id} alert={alert} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </Tabs>
        </div>
    );
}

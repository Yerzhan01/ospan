'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function AlertsWidget() {
    const { data: alerts, isLoading } = useAlerts({
        status: 'NEW', // Only show new alerts? or non-resolved. Let's show NEW + IN_PROGRESS 
        limit: 5
    });

    return (
        <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">
                    Требуют внимания
                </CardTitle>
                <Link href="/alerts">
                    <Button variant="ghost" size="sm" className="gap-1">
                        Все алёрты <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)
                ) : alerts?.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        Нет активных алёртов
                    </div>
                ) : (
                    alerts?.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                            <div className="flex items-center gap-3">
                                <AlertCircle className={cn(
                                    "h-4 w-4",
                                    alert.riskLevel === 'CRITICAL' ? "text-red-600" :
                                        alert.riskLevel === 'HIGH' ? "text-orange-600" :
                                            "text-yellow-600"
                                )} />
                                <div>
                                    <p className="text-sm font-medium">{alert.title}</p>
                                    <p className="text-xs text-muted-foreground">{alert.patient?.fullName}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {alert.riskLevel}
                            </Badge>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

import { cn } from '@/lib/utils';

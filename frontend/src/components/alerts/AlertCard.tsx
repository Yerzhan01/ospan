'use client';

import { Alert, RiskLevel } from '@/types/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronDown,
    CheckCircle,
    UserPlus,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useUpdateAlertStatus, useEscalateAlert } from '@/hooks/useAlerts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AlertCardProps {
    alert: Alert;
}

const riskConfig: Record<RiskLevel, { color: string; icon: React.ReactNode; borderColor: string }> = {
    CRITICAL: { color: 'text-red-600', borderColor: 'border-l-red-600', icon: <AlertCircle className="h-5 w-5 text-red-600" /> },
    HIGH: { color: 'text-orange-600', borderColor: 'border-l-orange-600', icon: <AlertTriangle className="h-5 w-5 text-orange-600" /> },
    MEDIUM: { color: 'text-yellow-600', borderColor: 'border-l-yellow-600', icon: <AlertTriangle className="h-5 w-5 text-yellow-600" /> },
    LOW: { color: 'text-blue-600', borderColor: 'border-l-blue-600', icon: <Info className="h-5 w-5 text-blue-600" /> },
};

export function AlertCard({ alert }: AlertCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const updateStatus = useUpdateAlertStatus();
    const escalate = useEscalateAlert();

    const config = riskConfig[alert.riskLevel] || riskConfig.LOW;

    const handleStatusChange = (status: 'IN_PROGRESS' | 'RESOLVED') => {
        updateStatus.mutate({ id: alert.id, data: { status } });
    };

    return (
        <Card className={cn("border-l-4", config.borderColor)}>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {config.icon}
                        <div>
                            <CardTitle className="text-base font-semibold">{alert.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Пациент: <span className="font-medium text-foreground">{alert.patient?.fullName}</span>
                            </p>
                        </div>
                    </div>
                    <Badge variant={alert.status === 'NEW' ? 'destructive' : 'outline'}>
                        {alert.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(alert.createdAt), 'PP p', { locale: ru })}
                        </span>
                        <span>Тип: {alert.type}</span>
                    </div>
                </div>

                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {alert.status === 'NEW' && (
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange('IN_PROGRESS')}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    В работу
                                </Button>
                            )}
                            {alert.status !== 'RESOLVED' && (
                                <>
                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleStatusChange('RESOLVED')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Закрыть
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => escalate.mutate(alert.id)}>
                                        Эскалировать
                                    </Button>
                                </>
                            )}
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-4 text-sm bg-muted/30 p-3 rounded-md">
                        <p className="font-medium mb-1">Описание:</p>
                        <p>{alert.description || 'Нет описания'}</p>
                        {alert.metadata && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                <p className="font-medium">Детали:</p>
                                <pre className="whitespace-pre-wrap">{JSON.stringify(alert.metadata, null, 2)}</pre>
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}

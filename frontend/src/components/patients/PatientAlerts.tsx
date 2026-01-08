import { Alert } from '@/types/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

interface PatientAlertsProps {
    alerts: Alert[];
    isLoading?: boolean;
}

export function PatientAlerts({ alerts, isLoading }: PatientAlertsProps) {
    if (isLoading) {
        return <div className="text-center py-8 text-muted-foreground">Загрузка алертов...</div>;
    }

    if (!alerts || alerts.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Алертов нет.</div>;
    }

    const getIcon = (risk: string) => {
        switch (risk) {
            case 'CRITICAL': return <AlertOctagon className="h-5 w-5 text-red-600" />;
            case 'HIGH': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            default: return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    const getRiskBadge = (risk: string) => {
        switch (risk) {
            case 'CRITICAL': return <Badge variant="destructive">КРИТИЧЕСКИЙ</Badge>;
            case 'HIGH': return <Badge className="bg-orange-500 hover:bg-orange-600">ВЫСОКИЙ</Badge>;
            case 'MEDIUM': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">СРЕДНИЙ</Badge>;
            default: return <Badge variant="secondary">НИЗКИЙ</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="mt-1">{getIcon(alert.riskLevel)}</div>
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2">
                                        {alert.title}
                                        {getRiskBadge(alert.riskLevel)}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {alert.description || 'Нет описания'}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>{format(new Date(alert.createdAt), 'PPP HH:mm', { locale: ru })}</span>
                                        <span>Статус: {alert.status}</span>
                                    </div>
                                </div>
                            </div>
                            {alert.status === 'NEW' && (
                                <Button size="sm" variant="outline">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Решить
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

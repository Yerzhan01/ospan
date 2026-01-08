import { Badge } from '@/components/ui/badge';

interface IntegrationStatusBadgeProps {
    status: 'connected' | 'pending_auth' | 'disconnected' | 'error';
    isEnabled: boolean;
}

export const IntegrationStatusBadge = ({ status, isEnabled }: IntegrationStatusBadgeProps) => {
    if (!isEnabled) {
        return <Badge variant="secondary">Disabled</Badge>;
    }

    switch (status) {
        case 'connected':
            return <Badge className="bg-green-500 hover:bg-green-600">Подключено</Badge>;
        case 'pending_auth':
            return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Авторизация</Badge>;
        case 'error':
            return <Badge variant="destructive">Ошибка</Badge>;
        case 'disconnected':
        default:
            return <Badge variant="secondary">Отключено</Badge>;
    }
};

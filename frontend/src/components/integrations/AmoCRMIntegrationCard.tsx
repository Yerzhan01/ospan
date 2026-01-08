'use client';

import { useState } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { Loader2, RefreshCw, LayoutDashboard } from 'lucide-react';

export const AmoCRMIntegrationCard = () => {
    const { amocrm } = useIntegrations();
    const { status, save, disconnect, sync } = amocrm;

    const [subdomain, setSubdomain] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [redirectUri, setRedirectUri] = useState('http://localhost:3000/api/v1/integrations/amocrm/callback');

    const handleSave = () => {
        save.mutate({ subdomain, clientId, clientSecret, redirectUri });
    };

    const handleDisconnect = () => {
        if (confirm('Вы уверены, что хотите отключить AmoCRM?')) {
            disconnect.mutate();
        }
    };

    const handleSync = () => {
        sync.mutate();
    };

    const isConnected = status?.status === 'connected';

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-blue-500" />
                            AmoCRM
                        </CardTitle>
                        <CardDescription>
                            Настройка интеграции с AmoCRM для синхронизации лидов и задач.
                        </CardDescription>
                    </div>
                    <IntegrationStatusBadge
                        status={status?.status || 'disconnected'}
                        isEnabled={status?.isEnabled || false}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {status?.lastError && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                        Ошибка: {status.lastError}
                    </div>
                )}

                {!isConnected ? (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subdomain">Subdomain (Поддомен)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="subdomain"
                                    value={subdomain}
                                    onChange={(e) => setSubdomain(e.target.value)}
                                    placeholder="example"
                                    className="text-right"
                                />
                                <span className="text-muted-foreground">.amocrm.ru</span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientId">Client ID (ID интеграции)</Label>
                            <Input
                                id="clientId"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="UUID"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientSecret">Client Secret (Секретный ключ)</Label>
                            <Input
                                id="clientSecret"
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                placeholder="Secret Key"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="redirectUri">Redirect URI</Label>
                            <Input
                                id="redirectUri"
                                value={redirectUri}
                                onChange={(e) => setRedirectUri(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Этот URI должен быть добавлен в настройках интеграции AmoCRM.</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={save.isPending || !subdomain || !clientId || !clientSecret}
                            className="w-full"
                        >
                            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Подключить (Авторизация)
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">Синхронизация</span>
                                <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
                                    <RefreshCw className={`mr-2 h-3 w-3 ${sync.isPending ? 'animate-spin' : ''}`} />
                                    Синхронизировать воронки
                                </Button>
                            </div>

                            {status?.pipelines && status.pipelines.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Доступные воронки</Label>
                                    <div className="space-y-1">
                                        {status.pipelines.map((p) => (
                                            <div key={p.id} className="text-xs flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="text-muted-foreground">{p.statuses.length} статусов</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            {isConnected && (
                <CardFooter className="justify-end border-t pt-4">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnect.isPending}
                    >
                        {disconnect.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Отключить
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

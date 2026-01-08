'use client';

import { useState } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { Loader2, QrCode as QrIcon, Router, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const WhatsAppIntegrationCard = () => {
    const { whatsapp } = useIntegrations();
    const { status, save, disconnect, test, qr } = whatsapp;

    const [idInstance, setIdInstance] = useState('');
    const [apiTokenInstance, setApiTokenInstance] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [isQrOpen, setIsQrOpen] = useState(false);

    const handleSave = () => {
        save.mutate({ idInstance, apiTokenInstance });
    };

    const handleDisconnect = () => {
        if (confirm('Вы уверены, что хотите отключить WhatsApp?')) {
            disconnect.mutate();
        }
    };

    const handleTestMessage = () => {
        test.mutate({ phone: testPhone, message: 'Тестовое сообщение от OSPAN' });
    };

    const handleShowQR = () => {
        qr.refetch();
        setIsQrOpen(true);
    };

    const isConnected = status?.status === 'connected';

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-green-500" />
                            WhatsApp (Green-API)
                        </CardTitle>
                        <CardDescription>
                            Настройка подключения к Green-API для WhatsApp сообщений.
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
                            <Label htmlFor="idInstance">idInstance</Label>
                            <Input
                                id="idInstance"
                                value={idInstance}
                                onChange={(e) => setIdInstance(e.target.value)}
                                placeholder="1101xxxxxx"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="apiTokenInstance">apiTokenInstance</Label>
                            <Input
                                id="apiTokenInstance"
                                type="password"
                                value={apiTokenInstance}
                                onChange={(e) => setApiTokenInstance(e.target.value)}
                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={save.isPending || !idInstance || !apiTokenInstance}
                            className="w-full"
                        >
                            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Подключить
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Статус инстанса:</span>
                                <span className="font-medium">{status?.instanceState}</span>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleShowQR}>
                                    <QrIcon className="mr-2 h-4 w-4" />
                                    Показать QR-код
                                </Button>
                                <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Сканировать QR-код</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex justify-center p-4">
                                            {qr.data ? (
                                                <img
                                                    src={`data:image/png;base64,${qr.data.message}`}
                                                    alt="WhatsApp QR Code"
                                                    className="w-64 h-64 border rounded"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-64 h-64 border rounded bg-muted">
                                                    {qr.isPending ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Нет QR-кода'}
                                                </div>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label>Тест подключения</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Телефон (например, 77011234567)"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={handleTestMessage}
                                    disabled={test.isPending || !testPhone}
                                >
                                    {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Отправить'}
                                </Button>
                            </div>
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

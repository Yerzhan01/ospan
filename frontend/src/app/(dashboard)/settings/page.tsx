'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
                <p className="text-muted-foreground">
                    Управление настройками системы и профиля
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Профиль
                        </CardTitle>
                        <CardDescription>
                            Настройки вашего профиля и учетной записи
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Функционал в разработке...
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Уведомления
                        </CardTitle>
                        <CardDescription>
                            Настройки уведомлений и оповещений
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Функционал в разработке...
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Безопасность
                        </CardTitle>
                        <CardDescription>
                            Пароль и параметры безопасности
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Функционал в разработке...
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Внешний вид
                        </CardTitle>
                        <CardDescription>
                            Тема и настройки интерфейса
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Функционал в разработке...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

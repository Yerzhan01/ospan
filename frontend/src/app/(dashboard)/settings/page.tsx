'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { User, Lock, Bell, Palette, Moon, Sun } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async () => {
        try {
            setIsLoading(true);
            await api.put('/auth/profile', {
                fullName,
                phone
                // Email update usually requires verification, so maybe skip or warn
            });
            toast.success('Профиль обновлен');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка обновления профиля');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Пароли не совпадают');
            return;
        }
        try {
            setIsLoading(true);
            await api.put('/auth/profile', {
                password: newPassword
            });
            toast.success('Пароль изменен');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка изменения пароля');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
                <p className="text-muted-foreground">
                    Управление профилем и параметрами приложения
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Профиль</TabsTrigger>
                    <TabsTrigger value="security">Безопасность</TabsTrigger>
                    <TabsTrigger value="notifications">Уведомления</TabsTrigger>
                    {/* <TabsTrigger value="appearance">Внешний вид</TabsTrigger> */}
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Личные данные</CardTitle>
                            <CardDescription>
                                Информация о вашем аккаунте
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-xl bg-primary/10">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Button variant="outline" size="sm">Изменить фото</Button>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>ФИО</Label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Иван Иванов"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Телефон</Label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+7..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={email}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Роль</Label>
                                    <Input
                                        value={user?.role || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleUpdateProfile} disabled={isLoading}>
                                Сохранить изменения
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Смена пароля</CardTitle>
                            <CardDescription>
                                Обновите пароль для безопасности аккаунта
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            {/* Note: Standard backend usually requires current password for change. 
                                Our simple `updateUser` might not check current password if admin updates, 
                                but self-update should ideally check. 
                                Since `updateProfile` currently just calls `userService.update`, 
                                it assumes authorized context is enough. 
                                We won't send `currentPassword` if backend doesn't support verifying it yet.
                            */}
                            {/* <div className="space-y-2">
                                <Label>Текущий пароль</Label>
                                <Input type="password" />
                            </div> */}

                            <div className="space-y-2">
                                <Label>Новый пароль</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Подтверждение пароля</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleChangePassword} disabled={isLoading || !newPassword}>
                                Обновить пароль
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* NOTIFICATIONS TAB */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Уведомления</CardTitle>
                            <CardDescription>
                                Настройте, как вы хотите получать оповещения
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="email-notif" className="flex flex-col space-y-1">
                                    <span>Email уведомления</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        Получать отчеты и важные алерты на почту
                                    </span>
                                </Label>
                                <Switch id="email-notif" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="browser-notif" className="flex flex-col space-y-1">
                                    <span>Browser Push</span>
                                    <span className="font-normal text-xs text-muted-foreground">
                                        Всплывающие уведомления в браузере
                                    </span>
                                </Label>
                                <Switch id="browser-notif" defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

'use client';

import { Bell, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        toast.success('Вы вышли из системы');
        router.push('/auth/login');
    };

    const userInitials = user?.fullName
        ? user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="font-medium text-muted-foreground">
                {user?.clinicId ? `Клиника #${user.clinicId}` : 'Администратор'}
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{userInitials}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                            <User className="h-4 w-4" />
                            Профиль
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <Settings className="h-4 w-4" />
                            Настройки
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 gap-2 cursor-pointer" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            Выйти
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

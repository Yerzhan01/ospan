'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, AlertCircle, CheckSquare, Settings, FileText } from 'lucide-react';

const sidebarItems = [
    { href: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { href: '/patients', icon: Users, label: 'Пациенты' },
    { href: '/alerts', icon: AlertCircle, label: 'Уведомления' },
    { href: '/tasks', icon: CheckSquare, label: 'Задачи' },
    { href: '/tasks', icon: CheckSquare, label: 'Задачи' },
    { href: '/scenarios', icon: FileText, label: 'Сценарии' },
    { href: '/settings/integrations', icon: Settings, label: 'Интеграции' },
    { href: '/settings', icon: Settings, label: 'Настройки' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r bg-background h-screen sticky top-0 flex flex-col">
            <div className="p-6 border-b h-16 flex items-center">
                <h1 className="text-xl font-bold text-primary">OSPAN.AI</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    isActive && "bg-secondary text-secondary-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                {/* User Profile or Logout could go here */}
            </div>
        </aside>
    );
}

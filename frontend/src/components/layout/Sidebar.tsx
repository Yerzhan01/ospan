'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, AlertCircle, CheckSquare, Settings, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type UserRole = 'ADMIN' | 'TRACKER' | 'DOCTOR' | 'OPERATOR';

const sidebarItems = [
    { href: '/', icon: LayoutDashboard, label: 'Дашборд', roles: ['ADMIN', 'TRACKER', 'DOCTOR', 'OPERATOR'] as UserRole[] },
    { href: '/patients', icon: Users, label: 'Пациенты', roles: ['ADMIN', 'TRACKER', 'DOCTOR'] as UserRole[] },
    { href: '/alerts', icon: AlertCircle, label: 'Уведомления', roles: ['ADMIN', 'TRACKER', 'DOCTOR'] as UserRole[] },
    { href: '/tasks', icon: CheckSquare, label: 'Задачи', roles: ['ADMIN', 'TRACKER', 'DOCTOR'] as UserRole[] },
    { href: '/scenarios', icon: FileText, label: 'Сценарии', roles: ['ADMIN'] as UserRole[] },
    { href: '/settings/integrations', icon: Settings, label: 'Интеграции', roles: ['ADMIN'] as UserRole[] },
    { href: '/settings', icon: Settings, label: 'Настройки', roles: ['ADMIN', 'TRACKER', 'DOCTOR', 'OPERATOR'] as UserRole[] },
];

export function Sidebar() {
    const pathname = usePathname();
    const user = useAuthStore(state => state.user);
    const userRole = user?.role as UserRole | undefined;

    // Filter items by user role
    const visibleItems = sidebarItems.filter(item =>
        !userRole || item.roles.includes(userRole)
    );

    return (
        <aside className="w-64 border-r bg-background h-screen sticky top-0 flex flex-col">
            <div className="p-6 border-b h-16 flex items-center">
                <h1 className="text-xl font-bold text-primary">OSPAN.AI</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {visibleItems.map((item, index) => {
                    // Smarter active detection:
                    // 1. Exact match for root '/'
                    // 2. For nested routes like '/settings/integrations' - exact match first
                    // 3. Otherwise, check if current path starts with the item href AND is not matched by a more specific item
                    const isExactMatch = pathname === item.href;
                    const isNestedMatch = item.href !== '/' && pathname.startsWith(item.href + '/');

                    // Check if there's a more specific item that matches
                    const hasMoreSpecificMatch = visibleItems.some(
                        (other, otherIndex) => otherIndex !== index &&
                            other.href.startsWith(item.href) &&
                            other.href.length > item.href.length &&
                            (pathname === other.href || pathname.startsWith(other.href + '/'))
                    );

                    const isActive = isExactMatch || (isNestedMatch && !hasMoreSpecificMatch);
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

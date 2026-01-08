'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useActivityStats } from '@/hooks/useDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { Users, AlertTriangle, CheckSquare, Activity } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
    const { data: activityData, isLoading: isActivityLoading } = useActivityStats();

    const firstName = user?.fullName?.split(' ')[1] || user?.fullName || 'Пользователь';

    // Mock values if stats are loading or undefined
    const totalPatients = stats?.patients?.total || 0;
    const activePatients = stats?.patients?.active || 0;
    const openAlerts = stats?.alerts?.total || 0; // Or new + inProgress
    const todayTasks = stats?.tasks?.today || 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">
                    Добрый день, {firstName}!
                </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Всего пациентов"
                    value={totalPatients}
                    icon={Users}
                    description={`Активных: ${activePatients}`}
                />
                <StatCard
                    title="Открытые алёрты"
                    value={openAlerts}
                    icon={AlertTriangle}
                    description={`${stats?.alerts?.critical || 0} критических`}
                    className={openAlerts > 0 ? "border-l-4 border-l-red-500" : ""}
                />
                <StatCard
                    title="Задачи на сегодня"
                    value={todayTasks}
                    icon={CheckSquare}
                    description={`${stats?.tasks?.overdue || 0} просрочено`}
                />
                <StatCard
                    title="Активность"
                    value="+12%"
                    icon={Activity}
                    description="рост ответов за неделю"
                    trend={{ value: 12, label: 'рост', positive: true }}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ActivityChart data={activityData || []} />
                <div className="col-span-3 space-y-4">
                    <AlertsWidget />
                    <TasksWidget />
                </div>
            </div>
        </div>
    );
}

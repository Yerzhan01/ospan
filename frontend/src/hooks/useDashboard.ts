import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PatientDashboardStats } from '@/types/patient';

interface AlertStats {
    total: number;
    new: number;
    inProgress: number;
    critical: number;
}

interface TaskStats {
    total: number;
    pending: number;
    overdue: number;
    today: number;
}

// Fetchers
const fetchPatientStats = async (): Promise<PatientDashboardStats> => {
    const { data } = await api.get('/patients/stats');
    return data.data;
};

const fetchAlertStats = async (): Promise<AlertStats> => {
    try {
        const { data } = await api.get('/alerts/stats');
        const stats = data.data;
        // Backend returns: { NEW: 5, IN_PROGRESS: 2, CRITICAL: 1, ... }
        // We map to frontend interface
        return {
            total: (stats.NEW || 0) + (stats.IN_PROGRESS || 0) + (stats.ESCALATED || 0),
            new: stats.NEW || 0,
            inProgress: (stats.IN_PROGRESS || 0) + (stats.ESCALATED || 0),
            critical: stats.CRITICAL || 0
        };
    } catch {
        return { total: 0, new: 0, inProgress: 0, critical: 0 };
    }
};

const fetchTaskStats = async (): Promise<TaskStats> => {
    try {
        const { data: response } = await api.get('/tasks/my');
        const tasks = response.data || { overdue: [], today: [], upcoming: [] };

        const overdueCount = tasks.overdue?.length || 0;
        const todayCount = tasks.today?.length || 0;
        const upcomingCount = tasks.upcoming?.length || 0;
        const total = overdueCount + todayCount + upcomingCount;

        return {
            total,
            pending: total,
            overdue: overdueCount,
            today: todayCount
        };
    } catch {
        return {
            total: 0,
            pending: 0,
            overdue: 0,
            today: 0
        };
    }
};

import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const fetchActivityStats = async (): Promise<{ date: string; count: number }[]> => {
    try {
        const { data } = await api.get('/answers/stats?days=7');
        // Format dates for display (e.g., "Pn", "Vt" or "01.01")
        return data.data.map((item: { date: string; count: number }) => ({
            date: format(parseISO(item.date), 'dd.MM', { locale: ru }),
            count: item.count
        }));
    } catch (e) {
        console.error('Failed to fetch activity stats', e);
        return [];
    }
};

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    activity: () => [...dashboardKeys.all, 'activity'] as const,
};

export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            const [patients, alerts, tasks] = await Promise.all([
                fetchPatientStats(),
                fetchAlertStats(),
                fetchTaskStats()
            ]);
            return { patients, alerts, tasks };
        }
    });
}

export function useActivityStats() {
    return useQuery({
        queryKey: dashboardKeys.activity(),
        queryFn: fetchActivityStats,
    });
}

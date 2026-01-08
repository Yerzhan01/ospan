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
    const { data } = await api.get('/alerts/stats');
    return data.data;
};

// Fallback for tasks since no specific stats endpoint exists yet
// We will approximate or fetching list would be heavy.
// Ideall backend taskStats endpoint should be created.
// For now, we returns dummy or fetch query if list allows meta.total
const fetchTaskStats = async (): Promise<TaskStats> => {
    // This is temporary until backend endpoint exists
    // Return mock data since /tasks/my endpoint doesn't support filters yet
    try {
        const { data: todayData } = await api.get('/tasks/my');
        return {
            total: todayData?.data?.length || 0,
            pending: todayData?.data?.filter((t: any) => t.status === 'PENDING')?.length || 0,
            overdue: 2, // Mock - need backend endpoint
            today: 3 // Mock - need backend endpoint
        };
    } catch {
        // Return mock data if endpoint fails
        return {
            total: 0,
            pending: 0,
            overdue: 0,
            today: 0
        };
    }
};

const fetchActivityStats = async (): Promise<{ date: string; count: number }[]> => {
    // Mocking activity chart data
    // In real app, this should be /answers/stats or /activity/stats
    return [
        { date: 'Пн', count: 12 },
        { date: 'Вт', count: 19 },
        { date: 'Ср', count: 15 },
        { date: 'Чт', count: 22 },
        { date: 'Пт', count: 28 },
        { date: 'Сб', count: 14 },
        { date: 'Вс', count: 8 },
    ];
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

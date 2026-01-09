import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Alert, AlertFilters, UpdateAlertStatusDto } from '@/types/alert';
import { toast } from 'sonner';

export const alertKeys = {
    all: ['alerts'] as const,
    lists: () => [...alertKeys.all, 'list'] as const,
    list: (filters: AlertFilters) => [...alertKeys.lists(), { ...filters }] as const,
    details: () => [...alertKeys.all, 'detail'] as const,
    detail: (id: string) => [...alertKeys.details(), id] as const,
};

const fetchAlerts = async (filters: AlertFilters): Promise<Alert[]> => {
    const params = new URLSearchParams();
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.type) params.append('type', filters.type);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);

    // Note: Backend might define endpoint as /alerts
    const { data } = await api.get('/alerts', { params });
    return data.data;
};

const fetchAlert = async (id: string): Promise<Alert> => {
    const { data } = await api.get(`/alerts/${id}`);
    return data.data;
};

const updateAlertStatus = async ({ id, data }: { id: string; data: UpdateAlertStatusDto }) => {
    const { data: response } = await api.put(`/alerts/${id}/status`, data);
    return response.data;
};

const escalateAlert = async (id: string) => {
    const { data } = await api.post(`/alerts/${id}/escalate`);
    return data.data;
};

export function useAlerts(filters: AlertFilters) {
    return useQuery({
        queryKey: alertKeys.list(filters),
        queryFn: () => fetchAlerts(filters),
    });
}

export function useAlert(id: string) {
    return useQuery({
        queryKey: alertKeys.detail(id),
        queryFn: () => fetchAlert(id),
        enabled: !!id,
    });
}

export function useUpdateAlertStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAlertStatus,
        onSuccess: (data) => {
            toast.success('Статус алерта обновлен');
            queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
            queryClient.invalidateQueries({ queryKey: alertKeys.detail(data.id) });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка обновления статуса');
        },
    });
}

export function useEscalateAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: escalateAlert,
        onSuccess: (data) => {
            toast.success('Алерт эскалирован администратору');
            queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
            queryClient.invalidateQueries({ queryKey: alertKeys.detail(data.id) });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка эскалации');
        },
    });
}

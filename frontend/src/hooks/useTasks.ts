import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Task, TaskFilters, UpdateTaskDto } from '@/types/task';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (filters: TaskFilters) => [...taskKeys.lists(), { ...filters }] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: string) => [...taskKeys.details(), id] as const,
};

const fetchTasks = async (filters: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters.status && filters.status !== 'all' as any) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.isOverdue) params.append('isOverdue', 'true');
    if (filters.patientId) params.append('patientId', filters.patientId);

    const { data } = await api.get('/tasks', { params });
    return data.data;
};

const updateTask = async ({ id, data }: { id: string; data: UpdateTaskDto }) => {
    const { data: response } = await api.put(`/tasks/${id}`, data);
    return response.data;
};

export function useTasks(filters: TaskFilters) {
    return useQuery({
        queryKey: taskKeys.list(filters),
        queryFn: () => fetchTasks(filters),
    });
}

export function useMyTasks() {
    const user = useAuthStore(state => state.user);
    // Assuming backend handles "me" or filtering by current user ID is manual.
    // Let's pass the user ID if available, or rely on backend default if not passed (though specific id is safer)
    return useQuery({
        queryKey: taskKeys.list({ assignedToId: user?.id }),
        queryFn: () => fetchTasks({ assignedToId: user?.id }),
        enabled: !!user?.id,
    });
}

export function useUpdateTaskStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTask,
        onSuccess: (data) => {
            toast.success('Задача обновлена');
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка обновления задачи');
        },
    });
}

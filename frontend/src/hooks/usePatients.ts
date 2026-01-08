import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    Patient,
    PatientFilters,
    CreatePatientDto,
    UpdatePatientDto,
    PatientListResponse,
    PatientCalendarDay
} from '@/types/patient';
import { toast } from 'sonner';

// Keys
export const patientKeys = {
    all: ['patients'] as const,
    lists: () => [...patientKeys.all, 'list'] as const,
    list: (filters: PatientFilters) => [...patientKeys.lists(), { ...filters }] as const,
    details: () => [...patientKeys.all, 'detail'] as const,
    detail: (id: string) => [...patientKeys.details(), id] as const,
    calendar: (id: string) => [...patientKeys.detail(id), 'calendar'] as const,
};

// Fetchers
const fetchPatients = async (filters: PatientFilters): Promise<PatientListResponse> => {
    // Clean undefined/empty filters
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.clinicId && filters.clinicId !== 'all') params.append('clinicId', filters.clinicId);
    if (filters.trackerId && filters.trackerId !== 'all') params.append('trackerId', filters.trackerId);
    if (filters.status && filters.status !== 'all' as any) params.append('status', filters.status!);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get('/patients', { params });
    return { data: data.data, meta: data.meta }; // Return structured response matching PatientListResponse interface
};

const fetchPatient = async (id: string): Promise<Patient> => {
    const { data } = await api.get(`/patients/${id}`);
    return data.data;
};

const createPatient = async (newPatient: CreatePatientDto): Promise<Patient> => {
    const { data } = await api.post('/patients', newPatient);
    return data.data;
};

const updatePatient = async ({ id, data }: { id: string; data: UpdatePatientDto }): Promise<Patient> => {
    const { data: response } = await api.put(`/patients/${id}`, data);
    return response.data;
};

const deletePatient = async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
};

const fetchPatientCalendar = async (id: string): Promise<PatientCalendarDay[]> => {
    const { data } = await api.get(`/patients/${id}/calendar`);
    return data.data;
};

// Hooks

export function usePatients(filters: PatientFilters) {
    return useQuery({
        queryKey: patientKeys.list(filters),
        queryFn: () => fetchPatients(filters),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    });
}

export function usePatient(id: string) {
    return useQuery({
        queryKey: patientKeys.detail(id),
        queryFn: () => fetchPatient(id),
        enabled: !!id,
    });
}

export function useCreatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPatient,
        onSuccess: () => {
            toast.success('Пациент успешно создан');
            queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка создания пациента');
        },
    });
}

export function useUpdatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePatient,
        onSuccess: (data) => {
            toast.success('Данные пациента обновлены');
            queryClient.invalidateQueries({ queryKey: patientKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка обновления пациента');
        },
    });
}

export function useDeletePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePatient,
        onSuccess: () => {
            toast.success('Пациент удален');
            queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка удаления пациента');
        },
    });
}

const fetchPatientHistory = async (id: string): Promise<any[]> => {
    const { data } = await api.get(`/patients/${id}/messages`);
    return data.data;
};

// ... existing hooks

const fetchPatientAlerts = async (id: string): Promise<any[]> => {
    // Assuming backend endpoint /patients/:id/alerts exists or we use generic /alerts?patientId=:id
    const { data } = await api.get(`/alerts`, { params: { patientId: id } });
    return data.data;
};

// ... existing hooks

export function usePatientAlerts(id: string) {
    return useQuery({
        queryKey: [...patientKeys.detail(id), 'alerts'],
        queryFn: () => fetchPatientAlerts(id),
        enabled: !!id,
    });
}

export function usePatientHistory(id: string) {
    return useQuery({
        queryKey: [...patientKeys.detail(id), 'history'],
        queryFn: () => fetchPatientHistory(id),
        enabled: !!id,
    });
}

export function usePatientCalendar(id: string) {
    return useQuery({
        queryKey: patientKeys.calendar(id),
        queryFn: () => fetchPatientCalendar(id),
        enabled: !!id,
    });
}

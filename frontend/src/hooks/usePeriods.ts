import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Period {
    id: string;
    name: string;
    startDate: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    patientId: string;
    patient?: {
        fullName: string;
    };
}

export const periodKeys = {
    all: ['periods'] as const,
    list: () => [...periodKeys.all, 'list'] as const,
};

const fetchPeriods = async (): Promise<Period[]> => {
    // Assuming GET /periods returns all periods
    // We might need to add an endpoint or use filtering
    const { data } = await api.get('/periods');
    return data.data;
};

export function usePeriods() {
    return useQuery({
        queryKey: periodKeys.list(),
        queryFn: fetchPeriods,
    });
}

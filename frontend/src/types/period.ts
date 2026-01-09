export type PeriodStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

export interface Period {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    durationDays: number;
    status: PeriodStatus;
    patientId: string;
    scenarioId?: string;
    patient?: {
        id: string;
        fullName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreatePeriodDto {
    name: string;
    patientId: string;
    scenarioId?: string;
    startDate?: Date;
    durationDays?: number;
}

export interface PeriodFilters {
    patientId?: string;
    status?: PeriodStatus;
}

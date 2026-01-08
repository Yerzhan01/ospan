export type PatientStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'PAUSED';

export interface Clinic {
    id: string;
    name: string;
}

export interface UserShort {
    id: string;
    fullName: string;
}

export interface Patient {
    id: string;
    fullName: string;
    phone: string;
    status: PatientStatus;
    programStartDate: string; // ISO Date string
    currentPeriodId?: string | null;
    clinicId?: string | null;
    trackerId?: string | null;
    doctorId?: string | null;
    clinic?: Clinic | null;
    tracker?: UserShort | null;
    doctor?: UserShort | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePatientDto {
    fullName: string;
    phone: string;
    programStartDate: Date; // Form will likely use Date object
    clinicId?: string;
    trackerId?: string;
    doctorId?: string;
    metadata?: Record<string, any>;
    amoCrmLeadId?: string;
}

export interface UpdatePatientDto {
    fullName?: string;
    phone?: string;
    status?: PatientStatus;
    programStartDate?: Date;
    clinicId?: string | null;
    trackerId?: string | null;
    doctorId?: string | null;
    metadata?: Record<string, any>;
    amoCrmLeadId?: string;
}

export interface PatientFilters {
    search?: string;
    clinicId?: string;
    trackerId?: string;
    status?: PatientStatus;
    page?: number;
    limit?: number;
}

export interface PatientListResponse {
    data: Patient[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface PatientCalendarDay {
    date: string; // YYYY-MM-DD
    dayNumber: number; // 1-42
    status: 'empty' | 'completed' | 'missed' | 'future';
    tasks: {
        id: string;
        type: 'question' | 'task';
        status: 'pending' | 'completed' | 'missed';
    }[];
}

export interface PatientDashboardStats {
    total: number;
    active: number;
    completed: number;
    withAlerts: number;
}

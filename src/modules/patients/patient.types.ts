import { Patient, Clinic, User, Period, PatientStatus } from '@prisma/client';

/**
 * Типы для модуля пациентов
 */

// DTO для создания пациента
export interface CreatePatientDto {
    fullName: string;
    phone: string;
    programStartDate: string | Date; // Строка от фронта, Date внутри
    clinicId?: string;
    trackerId?: string;
    doctorId?: string;
    metadata?: Record<string, unknown>;
    amoCrmLeadId?: string;
}

// DTO для обновления пациента
export interface UpdatePatientDto {
    fullName?: string;
    phone?: string;
    status?: PatientStatus;
    programStartDate?: string | Date;
    clinicId?: string | null;
    trackerId?: string | null;
    doctorId?: string | null;
    metadata?: Record<string, unknown>;
    amoCrmLeadId?: string;
}

// Элемент списка пациентов (облегченная версия)
export interface PatientListItem {
    id: string;
    fullName: string;
    phone: string;
    status: PatientStatus;
    programStartDate: Date;
    clinic?: { id: string; name: string } | null;
    tracker?: { id: string; fullName: string } | null;
    doctor?: { id: string; fullName: string } | null;
    currentPeriodId?: string | null;
}

// Полный объект пациента со всеми связями
export type PatientWithRelations = Patient & {
    clinic: Clinic | null;
    tracker: User | null;
    doctor: User | null;
    periods: Period[];
};

// Фильтры для списка пациентов
export interface PatientFilters {
    clinicId?: string;
    trackerId?: string;
    doctorId?: string;
    status?: PatientStatus;
    search?: string; // Поиск по имени или телефону
}

// Статистика по пациентам для дашборда
export interface PatientDashboardStats {
    total: number;
    active: number;
    completed: number;
    withAlerts: number;
}

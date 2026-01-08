import { Clinic } from '@prisma/client';

/**
 * Типы для модуля клиник
 */

// DTO для создания клиники
export interface CreateClinicDto {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    settings?: Record<string, unknown>;
}

// DTO для обновления клиники
export interface UpdateClinicDto {
    name?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    settings?: Record<string, unknown>;
    isActive?: boolean;
}

// Элемент списка клиник с краткой статистикой
export interface ClinicListItem extends Clinic {
    _count?: {
        patients: number;
        users: number;
    };
}

// Полный объект клиники
export type ClinicWithStats = Clinic & {
    _count: {
        patients: number;
        users: number;
    };
};

// Фильтры
export interface ClinicFilters {
    search?: string;
    isActive?: boolean;
}

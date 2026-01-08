import { z } from 'zod';
import { PatientStatus } from '@prisma/client';

// Регулярное выражение для базовой валидации телефона (RU/KZ формат)
// Допускает форматы: +79991234567, 89991234567, 79991234567
const PHONE_REGEX = /^(\+?7|8)\d{10}$/;

/**
 * Валидация телефона
 * Приводит к единому формату +7XXXXXXXXXX
 */
const phoneSchema = z.string()
    .regex(PHONE_REGEX, 'Неверный формат телефона. Используйте формат +7XXXXXXXXXX')
    .transform((val) => {
        // Приводим к формату +7XXXXXXXXXX
        if (val.startsWith('8')) return '+7' + val.substring(1);
        if (val.startsWith('7')) return '+' + val;
        return val;
    });

/**
 * Схема создания пациента
 */
export const createPatientSchema = z.object({
    fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    phone: phoneSchema,
    programStartDate: z.string().or(z.date()).transform((val) => new Date(val)),
    clinicId: z.string().cuid('Неверный ID клиники').optional(),
    trackerId: z.string().cuid('Неверный ID трекера').optional(),
    doctorId: z.string().cuid('Неверный ID врача').optional(),
    metadata: z.record(z.unknown()).optional(),
    amoCrmLeadId: z.string().optional(),
});

/**
 * Схема обновления пациента
 */
export const updatePatientSchema = z.object({
    fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
    phone: phoneSchema.optional(),
    status: z.nativeEnum(PatientStatus).optional(),
    programStartDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    clinicId: z.string().cuid('Неверный ID клиники').optional().nullable(),
    trackerId: z.string().cuid('Неверный ID трекера').optional().nullable(),
    doctorId: z.string().cuid('Неверный ID врача').optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
    amoCrmLeadId: z.string().optional(),
});

/**
 * Схема фильтрации списка пациентов
 */
export const patientFiltersSchema = z.object({
    clinicId: z.string().optional(),
    trackerId: z.string().optional(),
    doctorId: z.string().optional(),
    status: z.nativeEnum(PatientStatus).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Схема параметров ID пациента
 */
export const patientIdSchema = z.object({
    id: z.string().cuid('Некорректный ID пациента'),
});

/**
 * Типы, выведенные из Zod схем
 */
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientFiltersInput = z.infer<typeof patientFiltersSchema>;

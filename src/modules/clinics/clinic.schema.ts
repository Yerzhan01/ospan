import { z } from 'zod';

// Регулярное выражение для телефона (аналогично пациентам)
const PHONE_REGEX = /^(\+?7|8)\d{10}$/;

const phoneSchema = z.string()
    .regex(PHONE_REGEX, 'Неверный формат телефона')
    .transform((val) => {
        if (val.startsWith('8')) return '+7' + val.substring(1);
        if (val.startsWith('7')) return '+' + val;
        return val;
    });

/**
 * Схема создания клиники
 */
export const createClinicSchema = z.object({
    name: z.string().min(2, 'Название должно быть не менее 2 символов'),
    address: z.string().optional(),
    phone: phoneSchema.optional(),
    email: z.string().email('Некорректный Email').optional(),
    settings: z.record(z.unknown()).optional(),
});

/**
 * Схема обновления клиники
 */
export const updateClinicSchema = z.object({
    name: z.string().min(2, 'Название должно быть не менее 2 символов').optional(),
    address: z.string().optional().nullable(),
    phone: phoneSchema.optional().nullable(),
    email: z.string().email('Некорректный Email').optional().nullable(),
    settings: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
});

/**
 * Схема фильтров
 */
export const clinicFiltersSchema = z.object({
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(), // coerce позволяет передавать строку "true"
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Схема ID клиники
 */
export const clinicIdSchema = z.object({
    id: z.string().cuid('Некорректный ID клиники'),
});

// Types from schemas
export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
export type ClinicFiltersInput = z.infer<typeof clinicFiltersSchema>;

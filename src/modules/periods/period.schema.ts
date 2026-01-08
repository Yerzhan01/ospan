import { z } from 'zod';
import { PeriodStatus } from '@prisma/client';

/**
 * Схема настроек периода
 */
const periodSettingsSchema = z.object({
    allowedMissedDays: z.number().min(0).optional(),
    criticalMissedDays: z.number().min(0).optional(),
    reminderDelayMinutes: z.number().min(0).optional(),
    autoCompleteDay: z.boolean().optional(),
});

/**
 * Схема создания периода
 */
export const createPeriodSchema = z.object({
    patientId: z.string().cuid('Некорректный ID пациента'),
    name: z.string().min(2, 'Название должно быть не менее 2 символов'),
    durationDays: z.number().min(1, 'Длительность должна быть не менее 1 дня').max(365, 'Максимум 365 дней'),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    settings: periodSettingsSchema.optional(),
});

/**
 * Схема обновления периода
 */
export const updatePeriodSchema = z.object({
    name: z.string().min(2, 'Название должно быть не менее 2 символов').optional(),
    status: z.nativeEnum(PeriodStatus).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    settings: periodSettingsSchema.optional(),
});

/**
 * Схема ID периода
 */
export const periodIdSchema = z.object({
    id: z.string().cuid('Некорректный ID периода'),
});

/**
 * Схема параметров для действий с днем (завершение дня)
 */
export const completeDaySchema = z.object({
    dayNumber: z.number().min(1),
    completedByUserId: z.string().cuid().optional(), // Опционально, если выполнил врач
});

/**
 * Схема причины отмены
 */
export const cancelPeriodSchema = z.object({
    reason: z.string().min(3, 'Укажите причину отмены'),
});

// Types check
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;

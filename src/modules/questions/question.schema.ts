import { z } from 'zod';
import { TimeSlot, ResponseType } from '@prisma/client';

/**
 * Схема создания шаблона вопроса (базовая)
 */
const baseQuestionSchema = z.object({
    dayNumber: z.number().min(1).max(365),
    timeSlot: z.nativeEnum(TimeSlot),
    questionText: z.string().min(3),
    responseType: z.nativeEnum(ResponseType),
    isRequired: z.boolean().optional().default(true),
    order: z.number().int().optional().default(0),
    aiPrompt: z.string().optional().nullable(),
});

/**
 * Схема создания вопроса (одиночная)
 */
export const createQuestionSchema = baseQuestionSchema.extend({
    periodId: z.string().cuid(),
});

/**
 * Схема массового создания вопросов
 */
export const bulkCreateQuestionsSchema = z.object({
    periodId: z.string().cuid(),
    questions: z.array(baseQuestionSchema).min(1),
});

/**
 * Схема обновления вопроса
 */
export const updateQuestionSchema = z.object({
    questionText: z.string().min(3).optional(),
    responseType: z.nativeEnum(ResponseType).optional(),
    isRequired: z.boolean().optional(),
    order: z.number().int().optional(),
    aiPrompt: z.string().optional().nullable(),
});

/**
 * Схема копирования вопросов
 */
export const copyQuestionsSchema = z.object({
    sourcePeriodId: z.string().cuid(),
    targetPeriodId: z.string().cuid(),
});

/**
 * Схема параметров фильтрации (query params)
 */
export const questionFiltersSchema = z.object({
    dayNumber: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    timeSlot: z.nativeEnum(TimeSlot).optional(),
});

/**
 * Схема ID вопроса
 */
export const questionIdSchema = z.object({
    id: z.string().cuid(),
});

/**
 * Схема ID периода
 */
export const periodIdSchema = z.object({
    periodId: z.string().cuid(),
});

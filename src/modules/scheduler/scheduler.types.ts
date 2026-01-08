import { TimeSlot } from '@prisma/client';

/**
 * Конфигурация тайм-слота
 */
export interface TimeSlotConfig {
    slot: TimeSlot;
    hour: number;
    minute: number;
}

/**
 * Структура задачи для очереди сообщений
 */
export interface ScheduledMessageJob {
    patientId: string;
    periodId: string;
    questionTemplateId: string;
    dayNumber: number;
    timeSlot: TimeSlot;
    scheduledAt: string; // ISO date string
    questionText: string;
}

/**
 * Результат обработки задачи
 */
export interface JobResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

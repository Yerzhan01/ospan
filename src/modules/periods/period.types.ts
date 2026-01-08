import { Period, QuestionTemplate, DayLog, PeriodStatus } from '@prisma/client';

/**
 * Настройки периода
 */
export interface PeriodSettings {
    allowedMissedDays: number;
    criticalMissedDays: number;
    reminderDelayMinutes: number;
    autoCompleteDay: boolean;
}

/**
 * DTO для создания периода
 */
export interface CreatePeriodDto {
    patientId: string;
    name: string;
    durationDays: number;
    startDate: string | Date; // Придет как строка из JSON, преобразуем в Date
    settings?: Partial<PeriodSettings>;
}

/**
 * DTO для обновления периода
 */
export interface UpdatePeriodDto {
    name?: string;
    status?: PeriodStatus;
    endDate?: string | Date;
    settings?: Partial<PeriodSettings>;
}

/**
 * Период с прогрессом выполнения
 */
export interface PeriodWithProgress extends Period {
    progress?: {
        totalDays: number;
        completedDays: number;
        missedDays: number;
        percentage: number;
        currentDayNumber: number;
    };
    questionTemplates?: QuestionTemplate[];
    dayLogs?: DayLog[];
}

/**
 * Фильтры для периодов (опционально, если понадобится список)
 */
export interface PeriodFilters {
    patientId?: string;
    status?: PeriodStatus;
}

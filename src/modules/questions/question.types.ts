import { QuestionTemplate, TimeSlot, ResponseType } from '@prisma/client';

/**
 * DTO для создания шаблона вопроса
 */
export interface CreateQuestionTemplateDto {
    periodId: string;
    dayNumber: number;
    timeSlot: TimeSlot;
    questionText: string;
    responseType: ResponseType;
    isRequired?: boolean;
    order?: number;
    aiPrompt?: string | null;
}

/**
 * DTO для массового создания вопросов
 */
export interface BulkCreateQuestionsDto {
    periodId: string;
    questions: Omit<CreateQuestionTemplateDto, 'periodId'>[];
}

/**
 * DTO для поиска вопросов
 */
export interface QuestionFilters {
    periodId: string;
    dayNumber?: number;
    timeSlot?: TimeSlot;
}

/**
 * DTO для обновления шаблона вопроса
 */
export interface UpdateQuestionTemplateDto {
    questionText?: string;
    responseType?: ResponseType;
    isRequired?: boolean;
    order?: number;
    aiPrompt?: string | null;
}

/**
 * DTO для копирования вопросов
 */
export interface CopyQuestionsDto {
    sourcePeriodId: string;
    targetPeriodId: string;
}

/**
 * Группировка вопросов по слотам (для расписания)
 */
export interface QuestionsBySlot {
    [TimeSlot.MORNING]: QuestionTemplate[];
    [TimeSlot.AFTERNOON]: QuestionTemplate[];
    [TimeSlot.EVENING]: QuestionTemplate[];
}

/**
 * Полное расписание вопросов периода
 */
export interface QuestionSchedule {
    [dayNumber: number]: QuestionsBySlot;
}

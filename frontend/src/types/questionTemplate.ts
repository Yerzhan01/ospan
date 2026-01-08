export type ResponseType = 'TEXT' | 'PHOTO' | 'VOICE' | 'OPTION';
export type TimeSlot = 'MORNING' | 'NOON' | 'EVENING';

export interface QuestionTemplate {
    id: string;
    dayNumber: number; // 1-42
    timeSlot: TimeSlot;
    questionText: string;
    responseType: ResponseType;
    isRequired: boolean;
    order: number;
    aiPrompt?: string;
    periodId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateQuestionTemplateDto {
    dayNumber: number;
    timeSlot: TimeSlot;
    questionText: string;
    responseType: ResponseType;
    isRequired?: boolean;
    order?: number;
    aiPrompt?: string;
    periodId: string;
}

export interface UpdateQuestionTemplateDto {
    dayNumber?: number;
    timeSlot?: TimeSlot;
    questionText?: string;
    responseType?: ResponseType;
    isRequired?: boolean;
    order?: number;
    aiPrompt?: string;
}

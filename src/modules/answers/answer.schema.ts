import { z } from 'zod';
import { AnswerRiskLevel, ProcessedStatus } from './answer.types';

export const createAnswerSchema = z.object({
    text: z.string().min(1),
    mediaUrl: z.string().optional().nullable(),
    patientId: z.string().cuid(),
    periodId: z.string().cuid(),
    questionTemplateId: z.string().cuid(),
    dayNumber: z.number().int().min(1),
    timeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
    receivedAt: z.date().optional()
});

export const updateAnswerAnalysisSchema = z.object({
    processedStatus: z.nativeEnum(ProcessedStatus),
    riskLevel: z.nativeEnum(AnswerRiskLevel).optional(),
    analysisResult: z.record(z.any()).optional()
});

export const answerFilterSchema = z.object({
    patientId: z.string().cuid().optional(),
    periodId: z.string().cuid().optional(),
    dayNumber: z.coerce.number().int().optional(),
    riskLevel: z.nativeEnum(AnswerRiskLevel).optional(),
    processedStatus: z.nativeEnum(ProcessedStatus).optional()
});

export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerAnalysisInput = z.infer<typeof updateAnswerAnalysisSchema>;
export type AnswerFilterInput = z.infer<typeof answerFilterSchema>;

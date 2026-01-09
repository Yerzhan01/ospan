import { QuestionTemplate, Prisma, TimeSlot } from '@prisma/client';
import { getPrisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/utils/logger.js';
import {
    CreateQuestionTemplateDto,
    UpdateQuestionTemplateDto,
    QuestionsBySlot,
    QuestionSchedule
} from './question.types.js';

export class QuestionService {
    /**
     * Создать шаблон вопроса
     */
    async create(data: CreateQuestionTemplateDto): Promise<QuestionTemplate> {
        const prisma = await getPrisma();

        // Проверка уникальности
        const existing = await prisma.questionTemplate.findUnique({
            where: {
                periodId_dayNumber_timeSlot_order: {
                    periodId: data.periodId,
                    dayNumber: data.dayNumber,
                    timeSlot: data.timeSlot,
                    order: data.order || 0
                }
            }
        });

        if (existing) {
            throw AppError.conflict('Вопрос с таким порядковым номером уже существует в этом слоте');
        }

        return await prisma.questionTemplate.create({
            data: {
                ...data,
                order: data.order || 0,
            },
        });
    }

    /**
     * Массовое создание вопросов
     */
    async bulkCreate(periodId: string, questions: Omit<CreateQuestionTemplateDto, 'periodId'>[]): Promise<number> {
        const prisma = await getPrisma();

        if (questions.length === 0) return 0;

        const data = questions.map(q => ({
            ...q,
            periodId,
            order: q.order || 0,
        }));

        try {
            const result = await prisma.questionTemplate.createMany({
                data,
                skipDuplicates: true, // Пропускаем дубликаты, чтобы не падать всей пачкой
            });
            return result.count;
        } catch (error) {
            logger.error({ err: error }, 'Failed to bulk create questions');
            throw AppError.internal('Ошибка при массовом создании вопросов');
        }
    }

    /**
     * Получить все вопросы периода (сгруппированные по дням и слотам)
     */
    async findByPeriod(periodId: string): Promise<QuestionTemplate[]> {
        const prisma = await getPrisma();

        return await prisma.questionTemplate.findMany({
            where: { periodId },
            orderBy: [
                { dayNumber: 'asc' },
                { timeSlot: 'asc' },
                { order: 'asc' }
            ]
        });
    }

    /**
     * Получить вопросы конкретного дня
     */
    async findForDay(periodId: string, dayNumber: number): Promise<QuestionTemplate[]> {
        const prisma = await getPrisma();
        return await prisma.questionTemplate.findMany({
            where: { periodId, dayNumber },
            orderBy: [
                { timeSlot: 'asc' },
                { order: 'asc' }
            ]
        });
    }

    /**
     * Получить вопросы конкретного слота
     */
    async findForSlot(periodId: string, dayNumber: number, timeSlot: TimeSlot): Promise<QuestionTemplate[]> {
        const prisma = await getPrisma();
        return await prisma.questionTemplate.findMany({
            where: { periodId, dayNumber, timeSlot },
            orderBy: { order: 'asc' }
        });
    }

    /**
     * Обновить вопрос
     */
    async update(id: string, data: UpdateQuestionTemplateDto): Promise<QuestionTemplate> {
        const prisma = await getPrisma();

        try {
            return await prisma.questionTemplate.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw AppError.notFound('Вопрос не найден');
            }
            throw error;
        }
    }

    /**
     * Удалить вопрос
     */
    async delete(id: string): Promise<void> {
        const prisma = await getPrisma();
        try {
            await prisma.questionTemplate.delete({
                where: { id },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw AppError.notFound('Вопрос не найден');
            }
            throw error;
        }
    }

    /**
     * Копировать вопросы из одного периода в другой
     */
    async copyFromPeriod(sourcePeriodId: string, targetPeriodId: string): Promise<number> {
        const prisma = await getPrisma();

        const sourceQuestions = await prisma.questionTemplate.findMany({
            where: { periodId: sourcePeriodId },
        });

        if (sourceQuestions.length === 0) return 0;

        const newQuestions = sourceQuestions.map(q => ({
            periodId: targetPeriodId,
            dayNumber: q.dayNumber,
            timeSlot: q.timeSlot,
            questionText: q.questionText,
            responseType: q.responseType,
            isRequired: q.isRequired,
            order: q.order,
            aiPrompt: q.aiPrompt,
        }));

        const result = await prisma.questionTemplate.createMany({
            data: newQuestions,
            skipDuplicates: true,
        });

        return result.count;
    }
}

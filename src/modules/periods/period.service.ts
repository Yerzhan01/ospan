import { Period, Prisma, PeriodStatus } from '@prisma/client';

export const DayStatus = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    MISSED: 'missed',
    PARTIAL: 'partial',
} as const;
type DayStatus = typeof DayStatus[keyof typeof DayStatus];
import { getPrisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/utils/logger.js';
import {
    CreatePeriodDto,
    PeriodWithProgress,
    PeriodSettings
} from './period.types.js';
import dayjs from 'dayjs';

export class PeriodService {
    /**
     * Создание периода
     */
    async create(data: CreatePeriodDto, createdByUserId?: string): Promise<Period> {
        const prisma = await getPrisma();

        // 1. Проверяем, есть ли активный период у пациента
        const activePeriod = await prisma.period.findFirst({
            where: {
                patientId: data.patientId,
                status: PeriodStatus.ACTIVE,
            },
        });

        if (activePeriod) {
            throw AppError.conflict('У пациента уже есть активный период');
        }

        return await prisma.$transaction(async (tx) => {
            const startDate = dayjs(data.startDate).startOf('day').toDate();
            const endDate = dayjs(startDate).add(data.durationDays - 1, 'day').endOf('day').toDate();

            // 2. Создаем период
            const period = await tx.period.create({
                data: {
                    patientId: data.patientId,
                    name: data.name,
                    startDate: startDate,
                    endDate: undefined, // Дата фактического завершения пока null
                    durationDays: data.durationDays,
                    status: PeriodStatus.ACTIVE,
                    settings: data.settings ? (data.settings as Prisma.InputJsonValue) : Prisma.JsonNull,
                },
            });

            // 3. Генерируем DayLog записи на каждый день
            const dayLogsData = [];
            for (let i = 0; i < data.durationDays; i++) {
                const date = dayjs(startDate).add(i, 'day').toDate();
                dayLogsData.push({
                    periodId: period.id,
                    patientId: data.patientId, // Added patientId
                    dayNumber: i + 1,
                    date: date,
                    status: DayStatus.PENDING,
                });
            }

            await tx.dayLog.createMany({
                data: dayLogsData,
            });

            // 4. Обновляем текущий период у пациента
            await tx.patient.update({
                where: { id: data.patientId },
                data: { currentPeriodId: period.id },
            });

            // Emit Event
            const { eventBus, AppEvents } = await import('../../common/events/events.js');
            eventBus.emit(AppEvents.PERIOD_STARTED, { periodId: period.id, patientId: data.patientId });

            // 5. Audit Log
            await tx.auditLog.create({
                data: {
                    action: 'CREATE', // Check if this line is correct in context
                    entityType: 'PERIOD',
                    entityId: period.id,
                    userId: createdByUserId,
                    changes: data as unknown as Prisma.InputJsonValue,
                },
            });

            logger.info({ periodId: period.id, patientId: data.patientId }, 'Period created successfully');
            return period;
        });
    }

    /**
     * Получить активный период пациента
     */
    async findActiveByPatient(patientId: string): Promise<PeriodWithProgress | null> {
        const prisma = await getPrisma();
        const period = await prisma.period.findFirst({
            where: {
                patientId,
                status: PeriodStatus.ACTIVE,
            },
            include: {
                dayLogs: {
                    orderBy: { dayNumber: 'asc' },
                },
            },
        });

        if (!period) return null;
        return this.enrichWithProgress(period);
    }

    /**
     * Получить период по ID с прогрессом
     */
    async findById(id: string): Promise<PeriodWithProgress> {
        const prisma = await getPrisma();
        const period = await prisma.period.findUnique({
            where: { id },
            include: {
                patient: true,
                dayLogs: {
                    orderBy: { dayNumber: 'asc' },
                },
            },
        });

        if (!period) {
            throw AppError.notFound('Период не найден');
        }

        return this.enrichWithProgress(period);
    }

    /**
     * Получить список периодов пациента
     */
    async listByPatient(patientId: string): Promise<Period[]> {
        const prisma = await getPrisma();
        return await prisma.period.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Завершение дня (отметка о выполнении)
     */
    async completeDay(periodId: string, dayNumber: number, completedByUserId?: string): Promise<void> {
        const prisma = await getPrisma();

        const period = await prisma.period.findUnique({
            where: { id: periodId },
        });

        if (!period || period.status !== PeriodStatus.ACTIVE) {
            throw AppError.badRequest('Период не активен или не найден');
        }

        const dayLog = await prisma.dayLog.findFirst({
            where: { periodId, dayNumber },
        });

        if (!dayLog) {
            throw AppError.notFound('День не найден');
        }

        await prisma.$transaction(async (tx) => {
            // Обновляем статус дня
            await tx.dayLog.update({
                where: { id: dayLog.id },
                data: {
                    status: DayStatus.COMPLETED,
                    completedBy: completedByUserId,
                },
            });

            // Если это был последний день периода - автозавершение
            if (dayNumber === period.durationDays) {
                const settings = period.settings as unknown as PeriodSettings;
                if (settings?.autoCompleteDay !== false) { // По умолчанию автокомплит
                    // Рекурсивно вызываем завершение периода (или логику здесь)
                    // Для простоты, просто обновим статус
                    await this._completePeriodInternal(tx, periodId, completedByUserId);
                }
            }
        });
    }

    /**
     * Завершение периода вручную или автоматически
     */
    async complete(periodId: string, completedByUserId?: string): Promise<void> {
        const prisma = await getPrisma();
        await prisma.$transaction(async (tx) => {
            await this._completePeriodInternal(tx, periodId, completedByUserId);
        });
    }

    /**
     * Отмена периода
     */
    async cancel(periodId: string, reason: string, cancelledByUserId?: string): Promise<void> {
        const prisma = await getPrisma();

        const period = await prisma.period.findUnique({ where: { id: periodId } });
        if (!period) throw AppError.notFound('Период не найден');

        await prisma.$transaction(async (tx) => {
            await tx.period.update({
                where: { id: periodId },
                data: {
                    status: PeriodStatus.CANCELLED,
                    endDate: new Date(),
                },
            });

            // Отвязываем от пациента
            await tx.patient.update({
                where: { id: period.patientId },
                data: { currentPeriodId: null },
            });

            await tx.auditLog.create({
                data: {
                    action: 'CANCEL',
                    entityType: 'PERIOD',
                    entityId: periodId,
                    userId: cancelledByUserId,
                    changes: { reason } as Prisma.InputJsonValue,
                },
            });
        });
    }

    // --- Private Helpers ---

    private async _completePeriodInternal(tx: Prisma.TransactionClient, periodId: string, userId?: string) {
        const period = await tx.period.findUnique({ where: { id: periodId } });
        if (!period) return;

        await tx.period.update({
            where: { id: periodId },
            data: {
                status: PeriodStatus.COMPLETED,
                endDate: new Date(),
            },
        });

        await tx.patient.update({
            where: { id: period.patientId },
            data: { currentPeriodId: null },
        });

        await tx.auditLog.create({
            data: {
                action: 'COMPLETE',
                entityType: 'PERIOD',
                entityId: periodId,
                userId: userId,
            },
        });
    }

    private enrichWithProgress(period: any): PeriodWithProgress {
        const logs = period.dayLogs || [];
        const totalDays = period.durationDays;
        const completedDays = logs.filter((l: any) => l.status === DayStatus.COMPLETED).length;
        const missedDays = logs.filter((l: any) => l.status === DayStatus.MISSED).length;

        // Текущий день - это первый PENDING или последний, если все завершено
        // Или можно вычислить по дате
        const today = dayjs();
        const start = dayjs(period.startDate);
        let currentDayNumber = today.diff(start, 'day') + 1;
        if (currentDayNumber < 1) currentDayNumber = 1;
        if (currentDayNumber > totalDays) currentDayNumber = totalDays;

        return {
            ...period,
            progress: {
                totalDays,
                completedDays,
                missedDays,
                percentage: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
                currentDayNumber,
            }
        };
    }
}

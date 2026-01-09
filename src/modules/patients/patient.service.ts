import { Patient, Prisma, PatientStatus, PeriodStatus } from '@prisma/client';
import { getPrisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/utils/logger.js';
import {
    CreatePatientDto,
    UpdatePatientDto,
    PatientFilters,
    PatientWithRelations,
    PatientListItem,
    PatientDashboardStats
} from './patient.types.js';

export class PatientService {
    /**
     * Создание нового пациента
     */
    async create(data: CreatePatientDto, createdByUserId?: string): Promise<PatientWithRelations> {
        const prisma = await getPrisma();

        // Проверка уникальности телефона
        const existingPatient = await prisma.patient.findUnique({
            where: { phone: data.phone },
        });

        if (existingPatient) {
            throw AppError.conflict('Пациент с таким номером телефона уже существует');
        }

        return await prisma.$transaction(async (tx) => {
            // Создаём пациента
            const patient = await tx.patient.create({
                data: {
                    fullName: data.fullName,
                    phone: data.phone,
                    // Конвертируем строку в Date, если нужно
                    programStartDate: new Date(data.programStartDate),
                    clinicId: data.clinicId,
                    trackerId: data.trackerId,
                    doctorId: data.doctorId,
                    metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
                    amoCrmLeadId: data.amoCrmLeadId,
                    status: PatientStatus.ACTIVE,
                },
                include: {
                    clinic: true,
                    tracker: true,
                    doctor: true,
                    periods: true,
                },
            });

            // Запись в аудит
            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entityType: 'PATIENT',
                    entityId: patient.id,
                    userId: createdByUserId,
                    changes: patient as unknown as Prisma.InputJsonValue,
                },
            });

            // Emit Event
            const { eventBus, AppEvents } = await import('../../common/events/events.js');
            eventBus.emit(AppEvents.PATIENT_CREATED, { patientId: patient.id });

            logger.info({ patientId: patient.id }, 'Patient created successfully');
            return patient;
        });
    }

    /**
     * Получение пациента по ID
     */
    async findById(id: string): Promise<PatientWithRelations> {
        const prisma = await getPrisma();

        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                clinic: true,
                tracker: true,
                doctor: true,
                periods: {
                    orderBy: { startDate: 'desc' },
                },
            },
        });

        if (!patient) {
            throw AppError.notFound('Пациент не найден');
        }

        return patient;
    }

    /**
     * Получение списка пациентов с фильтрацией и пагинацией
     */
    async list(
        filters: PatientFilters,
        page: number = 1,
        limit: number = 20
    ): Promise<{ items: PatientListItem[]; total: number }> {
        const prisma = await getPrisma();
        const skip = (page - 1) * limit;

        const where: Prisma.PatientWhereInput = {};

        if (filters.clinicId) where.clinicId = filters.clinicId;
        if (filters.trackerId) where.trackerId = filters.trackerId;
        if (filters.doctorId) where.doctorId = filters.doctorId;
        if (filters.status) where.status = filters.status;

        // Поиск (case-insensitive для Postgres через mode: insensitive)
        if (filters.search) {
            where.OR = [
                { fullName: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search } },
            ];
        }

        const [items, total] = await prisma.$transaction([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    status: true,
                    programStartDate: true,
                    currentPeriodId: true,
                    clinic: { select: { id: true, name: true } },
                    tracker: { select: { id: true, fullName: true } },
                    doctor: { select: { id: true, fullName: true } },
                },
            }),
            prisma.patient.count({ where }),
        ]);

        return { items, total };
    }

    /**
     * Обновление данных пациента
     */
    async update(id: string, data: UpdatePatientDto, updatedByUserId?: string): Promise<PatientWithRelations> {
        const prisma = await getPrisma();

        // Проверяем существование
        const existingPatient = await prisma.patient.findUnique({ where: { id } });
        if (!existingPatient) {
            throw AppError.notFound('Пациент не найден');
        }

        // Если меняется телефон - проверяем уникальность
        if (data.phone && data.phone !== existingPatient.phone) {
            const phoneCheck = await prisma.patient.findUnique({ where: { phone: data.phone } });
            if (phoneCheck) {
                throw AppError.conflict('Этот номер телефона уже используется другим пациентом');
            }
        }

        return await prisma.$transaction(async (tx) => {
            const updatedPatient = await tx.patient.update({
                where: { id },
                data: {
                    ...data,
                    programStartDate: data.programStartDate ? new Date(data.programStartDate) : undefined,
                    metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
                },
                include: {
                    clinic: true,
                    tracker: true,
                    doctor: true,
                    periods: true,
                },
            });

            // Аудит
            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entityType: 'PATIENT',
                    entityId: id,
                    userId: updatedByUserId,
                    changes: data as unknown as Prisma.InputJsonValue,
                },
            });

            logger.info({ patientId: id }, 'Patient updated successfully');
            return updatedPatient;
        });
    }

    /**
     * Удаление пациента (Soft Delete)
     */
    async delete(id: string, deletedByUserId?: string): Promise<void> {
        const prisma = await getPrisma();

        const patient = await prisma.patient.findUnique({ where: { id } });
        if (!patient) {
            throw AppError.notFound('Пациент не найден');
        }

        await prisma.$transaction(async (tx) => {
            // Soft delete - обновляем статус и помечаем deletedAt
            // На самом деле в схеме есть поле deletedAt, используем его
            await tx.patient.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: PatientStatus.ARCHIVED, // или другое состояние, если нужно
                },
            });

            await tx.auditLog.create({
                data: {
                    action: 'DELETE',
                    entityType: 'PATIENT',
                    entityId: id,
                    userId: deletedByUserId,
                },
            });
        });

        logger.info({ patientId: id }, 'Patient soft-deleted');
    }

    /**
     * Получение статистики (дашборд)
     */
    async getDashboardStats(filters: PatientFilters = {}): Promise<PatientDashboardStats> {
        const prisma = await getPrisma();
        const where: Prisma.PatientWhereInput = {};

        if (filters.clinicId) where.clinicId = filters.clinicId;
        if (filters.trackerId) where.trackerId = filters.trackerId;
        if (filters.doctorId) where.doctorId = filters.doctorId;

        const [total, active, completed, withAlerts] = await prisma.$transaction([
            prisma.patient.count({ where }),
            prisma.patient.count({ where: { ...where, status: PatientStatus.ACTIVE } }),
            prisma.patient.count({ where: { ...where, status: PatientStatus.COMPLETED } }),
            // Пример подсчёта пациентов с активными алертами
            // (требует джойна или отдельного запроса, здесь упрощённо через count с related)
            prisma.patient.count({
                where: {
                    ...where,
                    status: PatientStatus.ACTIVE,
                    alerts: {
                        some: {
                            status: { in: ['NEW', 'IN_PROGRESS', 'ESCALATED'] },
                        },
                    },
                },
            }),
        ]);

        return { total, active, completed, withAlerts };
    }

    /**
     * Поиск по телефону (для вебхуков)
     */
    async findByPhone(phone: string): Promise<Patient | null> {
        const prisma = await getPrisma();
        return prisma.patient.findUnique({
            where: { phone },
        });
    }

    /**
     * Получение данных для календаря (6x7 = 42 дня)
     * Возвращает массив PatientCalendarDay для фронтенда
     */
    async getCalendar(patientId: string, periodId?: string) {
        const prisma = await getPrisma();

        // Если periodId не указан, берем текущий
        let targetPeriodId = periodId;

        if (!targetPeriodId) {
            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                select: { currentPeriodId: true, programStartDate: true },
            });
            targetPeriodId = patient?.currentPeriodId || undefined;
        }

        // Получаем период для дат
        const period = targetPeriodId ? await prisma.period.findUnique({
            where: { id: targetPeriodId },
            select: { startDate: true, durationDays: true },
        }) : null;

        if (!period) {
            // Возвращаем пустой календарь на 42 дня если период не найден
            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                select: { programStartDate: true },
            });
            const startDate = patient?.programStartDate || new Date();
            return this.generateEmptyCalendar(startDate, 42);
        }

        // Получаем DayLogs
        const dayLogs = await prisma.dayLog.findMany({
            where: {
                periodId: targetPeriodId!,
                patientId: patientId,
            },
            orderBy: { dayNumber: 'asc' },
        });

        // Создаём Map для быстрого поиска
        const dayLogMap = new Map(dayLogs.map(log => [log.dayNumber, log]));

        // Генерируем 42 дня
        const durationDays = Math.min(period.durationDays || 42, 42);
        const calendar: Array<{
            date: string;
            dayNumber: number;
            status: 'empty' | 'completed' | 'missed' | 'future';
            tasks: Array<{ id: string; type: 'question' | 'task'; status: 'pending' | 'completed' | 'missed' }>;
        }> = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= 42; day++) {
            const date = new Date(period.startDate);
            date.setDate(date.getDate() + day - 1);
            const dateStr = date.toISOString().split('T')[0];

            const dayLog = dayLogMap.get(day);
            const isFuture = date > today;
            const isPast = date < today;

            let status: 'empty' | 'completed' | 'missed' | 'future' = 'empty';
            const tasks: Array<{ id: string; type: 'question' | 'task'; status: 'pending' | 'completed' | 'missed' }> = [];

            if (day <= durationDays) {
                if (isFuture) {
                    status = 'future';
                    // Add pending tasks for future days
                    tasks.push(
                        { id: `${day}-morning`, type: 'question', status: 'pending' },
                        { id: `${day}-afternoon`, type: 'question', status: 'pending' },
                        { id: `${day}-evening`, type: 'question', status: 'pending' }
                    );
                } else if (dayLog) {
                    // Determine status based on completions
                    const completedCount = [dayLog.morningCompleted, dayLog.afternoonCompleted, dayLog.eveningCompleted].filter(Boolean).length;
                    if (completedCount === 3) {
                        status = 'completed';
                    } else if (completedCount > 0) {
                        status = 'completed'; // partial is shown as completed for simplicity
                    } else if (isPast) {
                        status = 'missed';
                    }

                    // Add task statuses
                    tasks.push(
                        { id: `${day}-morning`, type: 'question', status: dayLog.morningCompleted ? 'completed' : (isPast ? 'missed' : 'pending') },
                        { id: `${day}-afternoon`, type: 'question', status: dayLog.afternoonCompleted ? 'completed' : (isPast ? 'missed' : 'pending') },
                        { id: `${day}-evening`, type: 'question', status: dayLog.eveningCompleted ? 'completed' : (isPast ? 'missed' : 'pending') }
                    );
                } else if (isPast) {
                    status = 'missed';
                    tasks.push(
                        { id: `${day}-morning`, type: 'question', status: 'missed' },
                        { id: `${day}-afternoon`, type: 'question', status: 'missed' },
                        { id: `${day}-evening`, type: 'question', status: 'missed' }
                    );
                }
            }

            calendar.push({ date: dateStr, dayNumber: day, status, tasks });
        }

        return calendar;
    }

    private generateEmptyCalendar(startDate: Date, days: number) {
        const calendar = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= days; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day - 1);
            const dateStr = date.toISOString().split('T')[0];
            const isFuture = date > today;

            calendar.push({
                date: dateStr,
                dayNumber: day,
                status: isFuture ? 'future' : 'empty',
                tasks: [],
            });
        }
        return calendar;
    }
}

import { TimeSlot, PeriodStatus } from '@prisma/client';
import { getPrisma } from '../../config/database.js';
import { logger } from '../../common/utils/logger.js';
import { schedulerQueue } from './scheduler.queue.js';
import { DEFAULT_SCHEDULE } from './scheduler.config.js';
import { QuestionService } from '../questions/question.service.js';
import dayjs from 'dayjs';

export class SchedulerService {
    private questionService: QuestionService;

    constructor() {
        this.questionService = new QuestionService();
    }

    /**
     * Основной метод: планирование сообщений для всех активных пациентов на сегодня
     */
    async scheduleMessagesForToday() {
        logger.info('Starting scheduleMessagesForToday...');
        const prisma = await getPrisma();

        // 1. Находим все активные периоды
        const activePeriods = await prisma.period.findMany({
            where: {
                status: PeriodStatus.ACTIVE,
                patient: {
                    status: 'ACTIVE', // Если у вас есть статус пациента
                },
            },
            include: {
                patient: true,
            },
        });

        logger.info({ count: activePeriods.length }, 'Found active periods');

        let totalScheduled = 0;

        for (const period of activePeriods) {
            try {
                // 2. Вычисляем текущий день периода
                // День 1 = startDate.
                const today = dayjs().startOf('day');
                const startDate = dayjs(period.startDate).startOf('day');
                const diffDays = today.diff(startDate, 'day');
                const dayNumber = diffDays + 1; // 1-based index

                if (dayNumber > period.durationDays) {
                    // Period is finished
                    await prisma.period.update({
                        where: { id: period.id },
                        data: { status: PeriodStatus.COMPLETED }
                    });

                    logger.info({ periodId: period.id }, 'Period completed');

                    // Move AmoCRM Deal to next Stage
                    if (period.patient.amoCrmLeadId) {
                        try {
                            // TODO: Get Target Pipeline/Status ID from Config or DB
                            // For now, logging the intent.
                            // await amoCRMService.updateLeadStatus(Number(period.patient.amoCrmLeadId), TARGET_STATUS_ID);

                            // Let's assume we have a mapping helper or config.
                            // For MVP, if we have a "COMPLETED" status ID, we use it.
                            logger.info({ patientId: period.patientId }, 'Would move AmoCRM deal to Completed stage');
                        } catch (e) {
                            logger.error({ err: e }, 'Failed to sync period completion to AmoCRM');
                        }
                    }
                    continue;
                }

                if (dayNumber <= 0) {
                    logger.debug({ periodId: period.id, dayNumber }, 'Period active but day out of range (wait for update status)');
                    continue;
                }

                // 3. Получаем вопросы для этого дня
                const questions = await this.questionService.findForDay(period.id, dayNumber);

                if (questions.length === 0) {
                    continue;
                }

                // 4. Планируем отправку для каждого вопроса
                // Determine Schedule: Use Period Settings or Default
                let scheduleConfig = DEFAULT_SCHEDULE;
                if (period.settings && (period.settings as any).schedule) {
                    scheduleConfig = (period.settings as any).schedule;
                }

                for (const question of questions) {
                    // Находим конфиг времени для этого слота
                    const slotConfig = scheduleConfig.find(s => s.slot === question.timeSlot);

                    if (!slotConfig) {
                        logger.warn({ timeSlot: question.timeSlot, periodId: period.id }, 'No config for time slot');
                        continue;
                    }

                    // Формируем дату отправки: Сегодня + Время из конфига
                    const scheduledAt = dayjs()
                        .hour(slotConfig.hour)
                        .minute(slotConfig.minute)
                        .second(0)
                        .millisecond(0);

                    // Если время уже прошло - можно отправить "прямо сейчас" или пропустить
                    // Стратегия: если прошло менее 1 часа - отправить. Если больше - пропустить (или считать MISSED).
                    // Для простоты: BullMQ обработает delay <= 0 как "сразу".
                    // Но нам нужно не дублировать, если уже запланировано. BullMQ deduplication по jobId поможет.

                    await schedulerQueue.addJob({
                        patientId: period.patientId,
                        periodId: period.id,
                        questionTemplateId: question.id,
                        dayNumber: dayNumber,
                        timeSlot: question.timeSlot,
                        scheduledAt: scheduledAt.toISOString(),
                        questionText: question.questionText,
                    });

                    totalScheduled++;
                }

            } catch (error) {
                logger.error({ err: error, periodId: period.id }, 'Error processing period scheduling');
            }
        }

        logger.info({ totalScheduled }, 'Finished scheduleMessagesForToday');
        return totalScheduled;
    }
    /**
     * Finds and alerts on missed questions for active patients
     */
    async checkMissedQuestions() {
        logger.info('Starting checkMissedQuestions...');
        const prisma = await getPrisma();

        // Strategy: 
        // 1. Find active periods
        // 2. For each period, check if there are required questions for today (or previous days) that have NO answers
        //    AND the timeSlot has passed by X hours.

        // For simplicity: Check "yesterday's" missed questions or "today's morning" if it's evening.
        // Let's implement checking YESTERDAY's missed questions. 
        // If a required question from yesterday has no answer -> Alert.

        const activePeriods = await prisma.period.findMany({
            where: { status: 'ACTIVE' },
            include: { patient: true }
        });

        for (const period of activePeriods) {
            const startDate = dayjs(period.startDate).startOf('day');
            const today = dayjs().startOf('day');
            const daysActive = today.diff(startDate, 'day') + 1;

            if (daysActive <= 1) continue; // Skip first day or future

            // Check yesterday (dayNumber = daysActive - 1)
            const checkDayNum = daysActive - 1;

            const questions = await this.questionService.findForDay(period.id, checkDayNum);

            // Find answers for this day
            const answers = await prisma.answer.findMany({
                where: {
                    periodId: period.id,
                    dayNumber: checkDayNum
                }
            });

            const sentQuestions = questions; // Assuming we sent all? 
            // In reality, we should check if we actually sent them. 
            // But if they are required in Template, we expect answer.

            for (const q of sentQuestions) {
                if (!q.isRequired) continue;

                const hasAnswer = answers.some(a => a.questionTemplateId === q.id);
                if (!hasAnswer) {
                    // Check if Alert already exists for this
                    const existingAlert = await prisma.alert.findFirst({
                        where: {
                            patientId: period.patientId,
                            type: 'MISSED_RESPONSE',
                            metadata: {
                                path: ['questionId'],
                                equals: q.id
                            }
                        }
                    });

                    if (!existingAlert) {
                        logger.info({ patientId: period.patientId, questionId: q.id }, 'Creating MISSED_RESPONSE alert');
                        await prisma.alert.create({
                            data: {
                                patientId: period.patientId,
                                type: 'MISSED_RESPONSE',
                                riskLevel: 'MEDIUM',
                                title: 'Missed Report',
                                description: `Patient missed report for Day ${checkDayNum}, ${q.timeSlot}`,
                                triggeredBy: 'system',
                                metadata: { questionId: q.id, dayNumber: checkDayNum }
                            }
                        });

                        // TODO: Maybe send WhatsApp reminder?
                    }
                }
            }
        }
    }

    /**
     * Check for upcoming visits and send reminders
     */
    async checkVisits() {
        logger.info('Starting checkVisits...');
        const prisma = await getPrisma();
        const tomorrow = dayjs().add(1, 'day').startOf('day');
        const today = dayjs().startOf('day');

        // 1. Reminders for Tomorrow
        const visitsTomorrow = await prisma.visit.findMany({
            where: {
                scheduledDate: {
                    gte: tomorrow.toDate(),
                    lt: tomorrow.add(1, 'day').toDate()
                },
                status: 'scheduled'
            },
            include: { patient: true }
        });

        for (const visit of visitsTomorrow) {
            // Send WhatsApp reminder
            // TODO: Use a proper template system
            const message = `Напоминание: Завтра у вас визит в клинику.`;
            // await whatsappService.sendMessage(visit.patient.phone, message);
            logger.info({ visitId: visit.id, patientId: visit.patientId }, 'Would send 1-day Visit Reminder');
        }

        // 2. Reminders for Today (Morning)
        // Only run this if current time is morning (e.g. 8-10 AM) to avoid spamming?
        // OR rely on cron schedule (e.g. runs at 9 AM).
        const visitsToday = await prisma.visit.findMany({
            where: {
                scheduledDate: {
                    gte: today.toDate(),
                    lt: today.add(1, 'day').toDate()
                },
                status: 'scheduled'
            },
            include: { patient: true }
        });

        for (const visit of visitsToday) {
            const message = `Напоминание: Сегодня у вас визит в клинику. Ждем вас!`;
            // await whatsappService.sendMessage(visit.patient.phone, message);
            logger.info({ visitId: visit.id, patientId: visit.patientId }, 'Would send Same-Day Visit Reminder');
        }
    }
}

export const schedulerService = new SchedulerService();

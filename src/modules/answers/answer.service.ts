import { getPrisma } from '../../config/database.js';
import { logger } from '../../common/utils/logger.js';
import { IncomingMessage } from '../../integrations/whatsapp/whatsapp.types.js';
import { CreateAnswerDto, AnswerRiskLevel } from './answer.types.js';
import { answerQueue } from './answer.queue.js';
import dayjs from 'dayjs';

export class AnswerService {

    /**
     * Process an incoming WhatsApp message.
     * 1. Find patient by phone.
     * 2. Find active period.
     * 3. Determine current day number.
     * 4. Find expected question (first unanswered for the day).
     * 5. Create Answer record.
     * 6. Queue for AI analysis.
     */
    async processIncomingMessage(message: IncomingMessage): Promise<void> {
        const prisma = await getPrisma();
        const senderPhone = message.senderData.sender.replace('@c.us', '');
        const cleanPhone = senderPhone.replace(/\D/g, ''); // Ensure digits only if we store clean phones

        logger.info({ phone: cleanPhone }, 'Processing incoming message');

        // 1. Find Patient
        // We try to match loosely (e.g. contains) or exact. Assuming exact match for now or "endsWith"
        // Ideally phone in DB is standardized.
        const patient = await prisma.patient.findFirst({
            where: {
                phone: { contains: cleanPhone }
            }
        });

        if (!patient) {
            logger.warn({ phone: cleanPhone }, 'Patient not found for incoming message');
            // TODO: Maybe log to "UnknownMessages" table
            return;
        }

        if (!patient.currentPeriodId) {
            logger.warn({ patientId: patient.id }, 'Patient has no active period');
            return;
        }

        // 2. Find Active Period
        const period = await prisma.period.findUnique({
            where: { id: patient.currentPeriodId }
        });

        if (!period || period.status !== 'ACTIVE') {
            logger.warn({ patientId: patient.id, periodId: patient.currentPeriodId }, 'Active period not found or not active');
            return;
        }

        // 3. Determine Day Number
        const startDate = dayjs(period.startDate);
        const now = dayjs();
        const dayNumber = now.diff(startDate, 'day') + 1;

        if (dayNumber < 1 || dayNumber > period.durationDays) {
            logger.warn({
                patientId: patient.id,
                dayNumber,
                duration: period.durationDays
            }, 'Message received outside of period duration');
            // We might still want to record it, but for now we skip logic associated with a specific day's question
            // OR we just attach it to the last active day?
            // Proceeding only if valid day for now.
            return;
        }

        // 4. Find Expected Question
        // We look for questions for this day that don't have an answer yet.
        // We fetch questions AND their answers to check.
        const questionsForDay = await prisma.questionTemplate.findMany({
            where: {
                periodId: period.id,
                dayNumber: dayNumber
            },
            orderBy: [
                { timeSlot: 'asc' }, // MORNING < AFTERNOON < EVENING (alphabetical? No. Enum order in prisma?)
                // Enum: MORNING, AFTERNOON, EVENING. 
                // Alphabetical: AFTERNOON, EVENING, MORNING. 
                // We should rely on `order` field if we had one, or timeSlot logic.
                // Let's assume we interpret slots: Morning=0, Afternoon=1, Evening=2
                // Actually database ordering of Enums might be tricky.
                // We can fetch all and sort in memory.
                { order: 'asc' }
            ],
            include: {
                answers: {
                    where: {
                        periodId: period.id,
                        dayNumber: dayNumber // Ensure answer is for this specific day instance (though Template is linked to DayNumber generic? No, Template IS specific to dayNumber)
                        // Wait, QuestionTemplate has dayNumber. Answer links to QuestionTemplate.
                        // So just checking if an answer exists for this QuestionTemplate is roughly enough,
                        // BUT if we re-use templates across periods... Answer links to PeriodId too.
                        // Correct: Answer.questionTemplateId == question.id AND Answer.periodId == period.id
                    }
                }
            }
        });

        // Custom sort for time slots if needed, but assuming simple finding first without answer
        const timeSlotOrder = { 'MORNING': 0, 'AFTERNOON': 1, 'EVENING': 2 };
        const sortedQuestions = questionsForDay.sort((a, b) => {
            const slotA = timeSlotOrder[a.timeSlot as keyof typeof timeSlotOrder] ?? 99;
            const slotB = timeSlotOrder[b.timeSlot as keyof typeof timeSlotOrder] ?? 99;
            return slotA - slotB || a.order - b.order;
        });

        const targetQuestion = sortedQuestions.find(q => q.answers.length === 0);

        if (!targetQuestion) {
            logger.info({ patientId: patient.id, dayNumber }, 'No pending questions found for today');
            // Could be a general message.
            // TODO: Handle general messages
            return;
        }

        // 5. Create Answer
        let textBody = '';
        if (message.messageData.typeMessage === 'textMessage') {
            textBody = message.messageData.textMessageData?.textMessage || '';
        } else if (message.messageData.typeMessage === 'extendedTextMessage') {
            textBody = message.messageData.extendedTextMessageData?.text || '';
        }
        // TODO: Handle media mapping

        const answerData: CreateAnswerDto = {
            text: textBody,
            patientId: patient.id,
            periodId: period.id,
            questionTemplateId: targetQuestion.id,
            dayNumber: dayNumber,
            timeSlot: targetQuestion.timeSlot,
            receivedAt: new Date(message.timestamp * 1000)
        };

        // 5. Create Answer
        const newAnswer = await this.createAnswer(answerData);

        // 6. Queue for Analysis
        await answerQueue.addJob({
            answerId: newAnswer.id,
            text: newAnswer.textContent || '',
            patientId: patient.id,
            questionText: targetQuestion.questionText,
            previousContext: '' // Could fetch previous answers
        });
    }

    async createAnswer(data: CreateAnswerDto) {
        const prisma = await getPrisma();
        return prisma.answer.create({
            data: {
                textContent: data.text,
                photoUrl: data.mediaUrl, // Assuming media is photo for now
                patientId: data.patientId,
                periodId: data.periodId,
                questionTemplateId: data.questionTemplateId,
                dayNumber: data.dayNumber,
                timeSlot: data.timeSlot as any, // Cast to Enum
                createdAt: data.receivedAt,
                isProcessed: false,
                riskLevel: 'LOW' // Default
            }
        });
    }

    async findByPatientAndPeriod(patientId: string, periodId: string) {
        const prisma = await getPrisma();
        return prisma.answer.findMany({
            where: { patientId, periodId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByDay(patientId: string, periodId: string, dayNumber: number) {
        const prisma = await getPrisma();
        return prisma.answer.findMany({
            where: { patientId, periodId, dayNumber },
            orderBy: { createdAt: 'asc' },
            include: { questionTemplate: true }
        });
    }

    async getMissedResponses(patientId: string, periodId: string) {
        // Find all questions up to current time that don't have answers.
        // This is complex, might need a raw query or logic iteration.
        // Leaving placeholder/simplified for now.
        return [];
    }
}

export const answerService = new AnswerService();

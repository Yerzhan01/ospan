import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { logger } from '../../common/utils/logger.js';
import { MESSAGES_QUEUE_NAME } from './scheduler.config.js';
import { ScheduledMessageJob, JobResult } from './scheduler.types.js';
import { config } from '../../config/index.js';
// import { WhatsAppService } from '../whatsapp/whatsapp.service.js'; // TODO: Implement later

// Parse REDIS_URL for BullMQ connection
const parseRedisUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname || 'localhost',
            port: parseInt(parsed.port || '6379'),
            password: parsed.password || undefined,
        };
    } catch {
        return { host: 'localhost', port: 6379, password: undefined };
    }
};

const REDIS_CONNECTION = parseRedisUrl(config.redis.url);

export class SchedulerQueue {
    private queue: Queue;
    private worker: Worker;
    private queueEvents: QueueEvents;

    constructor() {
        // Инициализация очереди
        this.queue = new Queue(MESSAGES_QUEUE_NAME, {
            connection: REDIS_CONNECTION,
        });

        // Инициализация событий очереди (для логов и отладки)
        this.queueEvents = new QueueEvents(MESSAGES_QUEUE_NAME, {
            connection: REDIS_CONNECTION,
        });

        this.queueEvents.on('completed', ({ jobId }) => {
            logger.info({ jobId }, 'Job completed successfully');
        });

        this.queueEvents.on('failed', ({ jobId, failedReason }) => {
            logger.error({ jobId, failedReason }, 'Job failed');
        });

        // Инициализация воркера
        this.worker = new Worker<ScheduledMessageJob, JobResult>(
            MESSAGES_QUEUE_NAME,
            async (job: Job<ScheduledMessageJob>) => {
                logger.info({ jobId: job.id, data: job.data }, 'Processing job');

                try {
                    await this.processJob(job);
                    return { success: true, messageId: 'mock-id' };
                } catch (error: any) {
                    logger.error({ err: error }, 'Error processing job');
                    throw error;
                }
            },
            {
                connection: REDIS_CONNECTION,
                concurrency: 5, // Обработка 5 сообщений параллельно
                limiter: {
                    max: 10, // Лимит 10 сообщений
                    duration: 1000, // в секунду
                },
            }
        );

        logger.info('SchedulerQueue initialized');
    }

    /**
     * Добавление задачи в очередь
     */
    async addJob(data: ScheduledMessageJob) {
        // Создаем уникальный ID задачи, чтобы не дублировать отправку одного и того же вопроса в тот же день
        const jobId = `${data.patientId}-${data.periodId}-${data.dayNumber}-${data.timeSlot}`;

        // Вычисляем задержку (delay)
        const now = new Date().getTime();
        const scheduledTime = new Date(data.scheduledAt).getTime();
        const delay = Math.max(0, scheduledTime - now);

        await this.queue.add('send-message', data, {
            jobId,
            delay,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true, // Удалять успешные задачи
            removeOnFail: 100, // Хранить историю 100 упавших
        });

        logger.info({ jobId, scheduledAt: data.scheduledAt, delay }, 'Job added to queue');
    }

    /**
     * Логика обработки задачи
     */
    private async processJob(job: Job<ScheduledMessageJob>) {
        // TODO: Здесь будет вызов WhatsAppService
        // const whatsappService = new WhatsAppService();
        // await whatsappService.sendMessage(...)

        // Имитация отправки
        logger.info({
            patientId: job.data.patientId,
            text: job.data.questionText
        }, 'Simulating WhatsApp message sending...');

        // Симуляция асинхронной работы
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    /**
     * Закрытие соединений (для graceful shutdown)
     */
    async close() {
        await this.queue.close();
        await this.worker.close();
        await this.queueEvents.close();
    }
}

// Singleton instance
export const schedulerQueue = new SchedulerQueue();

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../../config/index.js';
import { logger } from '../../common/utils/logger.js';
import { AnswerProcessingJob } from './answer.types.js';
import { getPrisma } from '../../config/database.js';
import { answerProcessor } from './answer.processor.js';

export const ANSWER_QUEUE_NAME = 'answer-processing';

export class AnswerQueue {
    private queue: Queue;
    private worker: Worker;

    constructor() {
        const connection = new Redis(config.redis.url, {
            maxRetriesPerRequest: null
        });

        this.queue = new Queue(ANSWER_QUEUE_NAME, {
            connection: connection as any,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            },
        });

        this.worker = new Worker(
            ANSWER_QUEUE_NAME,
            async (job: Job<AnswerProcessingJob>) => {
                await this.processJob(job);
            },
            {
                connection: new Redis(config.redis.url, { maxRetriesPerRequest: null }) as any,
                concurrency: 5,
            }
        );

        this.worker.on('completed', (job) => {
            logger.info({ jobId: job.id, answerId: job.returnvalue }, 'Answer processing job completed');
        });

        this.worker.on('failed', (job, err) => {
            logger.error({ jobId: job?.id, error: err.message }, 'Answer processing job failed');
        });

        logger.info('AnswerQueue initialized');
    }

    async addJob(data: AnswerProcessingJob) {
        return this.queue.add('analyze-answer', data);
    }

    private async processJob(job: Job<AnswerProcessingJob>) {
        const { answerId } = job.data;
        logger.info({ answerId }, 'Processing answer analysis job');

        try {
            await answerProcessor.processAnswer(answerId);
        } catch (error: any) {
            logger.error({ answerId, error: error.message }, 'Job processing failed');
            throw error;
        }
    }

    async close() {
        await this.queue.close();
        await this.worker.close();
    }
}

export const answerQueue = new AnswerQueue();

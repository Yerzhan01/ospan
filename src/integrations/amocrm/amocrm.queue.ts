import { Queue, Worker } from 'bullmq';
import { config } from '../../config/index.js';
import { logger } from '../../common/utils/logger.js';
import { amoCRMAutomationService } from './amocrm.automation.js';
import { AppEvents } from '../../common/events/events.js';

export class AmoCRMQueue {
    private queue: Queue;

    constructor() {
        this.queue = new Queue('amocrm-automation', {
            connection: config.redis,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true
            }
        });

        this.setupWorker();
    }

    private setupWorker() {
        new Worker('amocrm-automation', async (job) => {
            const { event, payload } = job.data;
            logger.info({ jobId: job.id, event }, 'Processing AmoCRM Automation Job');

            try {
                switch (event) {
                    case AppEvents.PATIENT_CREATED:
                        await amoCRMAutomationService.processPatientCreated(payload);
                        break;
                    case AppEvents.PERIOD_STARTED:
                        await amoCRMAutomationService.processPeriodStarted(payload);
                        break;
                    case AppEvents.PERIOD_COMPLETED:
                        await amoCRMAutomationService.processPeriodCompleted(payload);
                        break;
                    case AppEvents.ALERT_CREATED:
                        await amoCRMAutomationService.processAlertCreated(payload);
                        break;
                    default:
                        logger.warn({ event }, 'Unknown event in AmoCRM Queue');
                }
            } catch (error) {
                logger.error({ error, jobId: job.id }, 'AmoCRM Job Failed');
                throw error;
            }
        }, {
            connection: config.redis
        });
    }

    /**
     * Add job to queue
     */
    async add(event: string, payload: any) {
        await this.queue.add('amocrm-event', { event, payload });
    }
}

export const amoCRMQueue = new AmoCRMQueue();

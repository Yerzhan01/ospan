import { schedulerService } from './scheduler.service.js';
import { logger } from '../../common/utils/logger.js';

/**
 * Инициализация планировщика cron задач
 */
export function initSchedulerCron() {
    logger.info('Initializing Scheduler Cron...');

    // Запускаем планирование сразу при старте (для теста и подстраховки)
    // В реальной жизни лучше делать это аккуратно, чтобы не спамить при рестартах.
    // Но у нас есть BullMQ deduplication по jobId (patient-period-day-slot), так что безопасно.
    schedulerService.scheduleMessagesForToday().catch(err => {
        logger.error({ err }, 'Error in initial scheduling');
    });

    // Устанавливаем интервал: Раз в час проверяем, есть ли что запланировать (или просто раз в день в 00:01)
    // Для надежности можно запускать каждое утро в 01:00.
    // И еще раз каждые 30 минут на случай сбоев/новых пациентов.

    const ONE_HOUR = 60 * 60 * 1000;

    setInterval(() => {
        logger.info('Running periodic scheduling task...');
        schedulerService.scheduleMessagesForToday().catch(err => {
            logger.error({ err }, 'Error in periodic scheduling');
        });

        schedulerService.checkVisits().catch(err => {
            logger.error({ err }, 'Error in periodic visit checking');
        });
    }, ONE_HOUR);
}

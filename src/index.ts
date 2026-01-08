import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';

import { config, validateConfig } from './config/index.js';
import { logger } from './common/utils/logger.js';
import { getPrisma, connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis, pingRedis } from './config/redis.js';
import { errorHandler } from './common/errors/index.js';
import { successResponse } from './common/utils/index.js';

// Модули
import { userRouter } from './modules/users/index.js';
import { patientRoutes } from './modules/patients/patient.router.js';
import { clinicRoutes } from './modules/clinics/clinic.router.js';
import { periodRoutes } from './modules/periods/period.router.js';
import { questionRoutes } from './modules/questions/question.router.js';
import { answerRoutes } from './modules/answers/answer.router.js';
import { initSchedulerCron } from './modules/scheduler/scheduler.cron.js';
import { handleWhatsAppWebhook } from './integrations/whatsapp/whatsapp.webhook.js';

/**
 * Создаёт и настраивает Fastify инстанс
 */
async function createApp() {
    // Создание Fastify инстанса
    const app = Fastify({
        logger: false, // Используем свой pino logger
        trustProxy: true,
    });

    // ============================================
    // РЕГИСТРАЦИЯ ПЛАГИНОВ
    // ============================================

    // CORS
    await app.register(cors, {
        origin: true,
        credentials: true,
    });

    // JWT
    await app.register(jwt, {
        secret: config.jwt.secret,
    });

    // Cookies
    await app.register(cookie);

    // ============================================
    // ГЛОБАЛЬНЫЕ ХУКИ
    // ============================================

    // Логирование входящих запросов
    app.addHook('onRequest', async (request: FastifyRequest) => {
        logger.info({
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        }, 'Incoming request');
    });

    // Логирование ответов
    app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
        logger.info({
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime: reply.elapsedTime,
        }, 'Request completed');
    });

    // Глобальный обработчик ошибок
    app.setErrorHandler(errorHandler);

    // ============================================
    // СИСТЕМНЫЕ РОУТЫ (без авторизации)
    // ============================================

    // Вебхук WhatsApp (без авторизации jwt)
    app.post('/api/v1/webhook/whatsapp', handleWhatsAppWebhook);

    // Health check
    app.get('/health', async () => {
        let databaseStatus = 'disconnected';
        let redisStatus = 'disconnected';

        // Проверка БД
        try {
            const prisma = await getPrisma();
            await prisma.$connect();
            databaseStatus = 'connected';
        } catch {
            databaseStatus = 'error';
        }

        // Проверка Redis
        try {
            const isConnected = await pingRedis();
            redisStatus = isConnected ? 'connected' : 'disconnected';
        } catch {
            redisStatus = 'error';
        }

        const isHealthy = databaseStatus === 'connected' && redisStatus === 'connected';

        return {
            status: isHealthy ? 'ok' : 'degraded',
            database: databaseStatus,
            redis: redisStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.env,
        };
    });

    // API информация
    app.get('/api/v1', async () => {
        return successResponse({
            name: 'Patient Assistant API',
            version: '1.0.0',
            description: 'Система сопровождения пациентов',
            documentation: '/api/v1/docs',
        });
    });

    // ============================================
    // МОДУЛИ API
    // ============================================

    // Модуль пользователей и аутентификации
    await app.register(userRouter, { prefix: '/api/v1' });

    // Модуль интеграций
    const { integrationRouter } = await import('./modules/integrations/integration.router.js');
    await app.register(integrationRouter, { prefix: '/api/v1/integrations' });

    // TODO: Здесь будут регистрироваться другие модули
    // Модуль пациентов
    await app.register(patientRoutes, { prefix: '/api/v1/patients' });

    // Модуль клиник
    await app.register(clinicRoutes, { prefix: '/api/v1/clinics' });

    // Модуль периодов
    await app.register(periodRoutes, { prefix: '/api/v1/periods' });

    // Модуль вопросов
    await app.register(questionRoutes, { prefix: '/api/v1' });

    // Модуль ответов
    await app.register(answerRoutes, { prefix: '/api/v1' });

    // Инициализация сервисов
    const { eventBus, AppEvents } = await import('./common/events/events.js');
    const { amoCRMQueue } = await import('./integrations/amocrm/amocrm.queue.js');

    // Subscribe to events -> Send to Queue
    Object.values(AppEvents).forEach(event => {
        eventBus.on(event, (payload) => {
            amoCRMQueue.add(event, payload).catch(err => {
                app.log.error({ err, event }, 'Failed to add event to AmoCRM Queue');
            });
        });
    });

    // Инициализация планировщика
    initSchedulerCron();

    // Модуль алёртов
    const { alertsRouter } = await import('./modules/alerts/alert.router.js');
    await app.register(alertsRouter, { prefix: '/api/v1' });

    // Модуль задач
    const { tasksRouter } = await import('./modules/tasks/task.router.js');
    await app.register(tasksRouter, { prefix: '/api/v1' });

    // Test Routes (Dev only)
    if (config.env === 'development') {
        const { testRoutes } = await import('./modules/test/test.router.js');
        await app.register(testRoutes, { prefix: '/api/v1' });
    }

    return app;
}

/**
 * Graceful shutdown - корректное завершение работы
 */
async function gracefulShutdown(app: Awaited<ReturnType<typeof createApp>>, signal: string) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        // Закрываем HTTP сервер
        await app.close();
        logger.info('HTTP server closed');

        // Отключаемся от БД
        await disconnectDatabase();
        logger.info('Database disconnected');

        // Отключаемся от Redis
        await disconnectRedis();
        logger.info('Redis disconnected');

        logger.info('Graceful shutdown completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Error during graceful shutdown');
        process.exit(1);
    }
}

/**
 * Bootstrap - запуск приложения
 */
async function bootstrap() {
    try {
        // 1. Валидация конфигурации
        logger.info('Validating configuration...');
        validateConfig();
        logger.info('✅ Configuration validated');

        // 2. Подключение к базе данных
        logger.info('Connecting to database...');
        await connectDatabase();

        // 3. Подключение к Redis
        logger.info('Connecting to Redis...');
        await connectRedis();

        // 4. Создание приложения
        logger.info('Creating application...');
        const app = await createApp();

        // 5. Регистрация обработчиков shutdown
        process.on('SIGTERM', () => gracefulShutdown(app, 'SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown(app, 'SIGINT'));

        // 6. Запуск сервера
        const host = '0.0.0.0';
        const port = config.port;

        await app.listen({ port, host });

        logger.info('='.repeat(50));
        logger.info(`🚀 Patient Assistant API started successfully!`);
        logger.info(`📍 Server: http://${host}:${port}`);
        logger.info(`📋 Health: http://${host}:${port}/health`);
        logger.info(`📚 API: http://${host}:${port}/api/v1`);
        logger.info(`🌍 Environment: ${config.env}`);
        logger.info('='.repeat(50));
    } catch (error) {
        console.error('SERVER STARTUP ERROR:', error);
        logger.error({ error }, '❌ Failed to start application');
        process.exit(1);
    }
}

// Запуск приложения
// Экспортируем createApp для тестов
export { createApp };

// Запуск приложения только если файл запущен напрямую
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    bootstrap();
}

import { FastifyInstance } from 'fastify';
import { PeriodController } from './period.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { roleGuard } from '../../common/middleware/roleGuard.js';

export async function periodRoutes(fastify: FastifyInstance) {
    const controller = new PeriodController();

    // Глобальная защита
    fastify.addHook('preHandler', authMiddleware);

    // POST /api/v1/periods - Создать период (ADMIN, TRACKER)
    fastify.post(
        '/',
        {
            preHandler: [roleGuard(['ADMIN', 'TRACKER'])],
        },
        controller.create
    );

    // GET /api/v1/periods - Список всех периодов
    fastify.get('/', controller.listAll);

    // GET /api/v1/periods/:id - Детали периода
    fastify.get('/:id', controller.getById);

    // POST /api/v1/periods/:id/complete-day - Завершить день
    fastify.post('/:id/complete-day', controller.completeDay);

    // POST /api/v1/periods/:id/complete - Завершить период (ADMIN, TRACKER)
    fastify.post(
        '/:id/complete',
        {
            preHandler: [roleGuard(['ADMIN', 'TRACKER'])],
        },
        controller.complete
    );

    // POST /api/v1/periods/:id/cancel - Отменить период (ADMIN, TRACKER)
    fastify.post(
        '/:id/cancel',
        {
            preHandler: [roleGuard(['ADMIN', 'TRACKER'])],
        },
        controller.cancel
    );

    // GET /api/v1/periods/patient/:patientId - Список периодов пациента
    fastify.get('/patient/:patientId', controller.listByPatient);
}

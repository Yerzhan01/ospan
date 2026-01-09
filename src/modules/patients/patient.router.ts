import { FastifyInstance } from 'fastify';
import { PatientController } from './patient.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { roleGuard } from '../../common/middleware/roleGuard.js';

export async function patientRoutes(fastify: FastifyInstance) {
    const controller = new PatientController();

    // Глобальный middleware авторизации для всех роутов пациентов
    fastify.addHook('preHandler', authMiddleware);

    // GET /api/v1/patients/stats - Статистика (только админы)
    fastify.get(
        '/stats',
        {
            preHandler: [roleGuard(['ADMIN'])],
        },
        controller.getStats
    );

    // GET /api/v1/patients - Список пациентов
    fastify.get('/', controller.list);

    // GET /api/v1/patients/:id - Данные пациента
    fastify.get('/:id', controller.getById);

    // GET /api/v1/patients/:id/calendar - Календарь пациента
    fastify.get('/:id/calendar', controller.getCalendar);

    // GET /api/v1/patients/:id/tasks - Задачи пациента
    fastify.get('/:id/tasks', controller.getTasks);

    // POST /api/v1/patients - Создание пациента (Админ, Трекер)
    fastify.post(
        '/',
        {
            preHandler: [roleGuard(['ADMIN', 'TRACKER'])],
        },
        controller.create
    );

    // PUT /api/v1/patients/:id - Обновление пациента (Админ, Трекер)
    fastify.put(
        '/:id',
        {
            preHandler: [roleGuard(['ADMIN', 'TRACKER'])],
        },
        controller.update
    );

    // DELETE /api/v1/patients/:id - Удаление пациента (Админ)
    fastify.delete(
        '/:id',
        {
            preHandler: [roleGuard(['ADMIN'])],
        },
        controller.delete
    );
}

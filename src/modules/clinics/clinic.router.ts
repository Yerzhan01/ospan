import { FastifyInstance } from 'fastify';
import { ClinicController } from './clinic.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { roleGuard } from '../../common/middleware/roleGuard.js';

export async function clinicRoutes(fastify: FastifyInstance) {
    const controller = new ClinicController();

    // Глобальная защита токеном
    fastify.addHook('preHandler', authMiddleware);

    // GET /api/v1/clinics - Список клиник (доступно всем авторизованным, чтобы видеть варианты)
    fastify.get('/', controller.list);

    // GET /api/v1/clinics/:id - Детали клиники
    fastify.get('/:id', controller.getById);

    // POST /api/v1/clinics - Создание (Только АДМИН)
    fastify.post(
        '/',
        {
            preHandler: [roleGuard(['ADMIN'])],
        },
        controller.create
    );

    // PUT /api/v1/clinics/:id - Обновление (Только АДМИН)
    fastify.put(
        '/:id',
        {
            preHandler: [roleGuard(['ADMIN'])],
        },
        controller.update
    );

    // DELETE /api/v1/clinics/:id - Удаление (Только АДМИН)
    fastify.delete(
        '/:id',
        {
            preHandler: [roleGuard(['ADMIN'])],
        },
        controller.delete
    );
}

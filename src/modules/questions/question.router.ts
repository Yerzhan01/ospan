import { FastifyInstance } from 'fastify';
import { QuestionController } from './question.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { roleGuard } from '../../common/middleware/roleGuard.js';

export async function questionRoutes(fastify: FastifyInstance) {
    const controller = new QuestionController();

    fastify.addHook('preHandler', authMiddleware);

    // --- Nested routes under periods ---
    // GET /api/v1/periods/:periodId/questions
    fastify.get('/periods/:periodId/questions', controller.getByPeriod);

    // GET /api/v1/periods/:periodId/questions/day/:dayNumber
    fastify.get('/periods/:periodId/questions/day/:dayNumber', controller.getByDay);

    // POST /api/v1/periods/:periodId/questions
    fastify.post(
        '/periods/:periodId/questions',
        { preHandler: [roleGuard(['ADMIN', 'TRACKER'])] },
        controller.create
    );

    // POST /api/v1/periods/:periodId/questions/bulk
    fastify.post(
        '/periods/:periodId/questions/bulk',
        { preHandler: [roleGuard(['ADMIN', 'TRACKER'])] },
        controller.bulkCreate
    );

    // --- Direct question routes ---
    // PUT /api/v1/questions/:id
    fastify.put(
        '/questions/:id',
        { preHandler: [roleGuard(['ADMIN', 'TRACKER'])] },
        controller.update
    );

    // DELETE /api/v1/questions/:id
    fastify.delete(
        '/questions/:id',
        { preHandler: [roleGuard(['ADMIN', 'TRACKER'])] },
        controller.delete
    );

    // POST /api/v1/questions/copy
    fastify.post(
        '/questions/copy',
        { preHandler: [roleGuard(['ADMIN', 'TRACKER'])] },
        controller.copy
    );
}

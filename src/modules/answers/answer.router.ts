import { FastifyInstance } from 'fastify';
import { answerController } from './answer.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';

export async function answerRoutes(app: FastifyInstance) {

    // Guard: all routes require authentication
    app.addHook('preHandler', authMiddleware);

    app.get('/patients/:patientId/answers', answerController.getPatientAnswers);
    app.get('/periods/:periodId/answers', answerController.getPeriodAnswers);
    app.get('/answers/:id', answerController.getAnswerById);

}

import { FastifyInstance } from 'fastify';
import { alertController } from './alert.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';

export async function alertsRouter(app: FastifyInstance) {

    app.addHook('preHandler', authMiddleware);

    // List & Stats
    app.get('/alerts', alertController.list);
    app.get('/alerts/stats', alertController.getStats);

    // Detail & Actions
    app.get('/alerts/:id', alertController.getById);
    app.put('/alerts/:id/status', alertController.updateStatus);
    app.post('/alerts/:id/escalate', alertController.escalate);

    // Patient Context
    app.get('/patients/:patientId/alerts', alertController.getPatientAlerts);
}

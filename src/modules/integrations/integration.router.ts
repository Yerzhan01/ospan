import { FastifyInstance } from 'fastify';
import { integrationController } from './integration.controller.js';
import { authMiddleware as authenticate } from '../../common/middleware/auth.js';

export async function integrationRouter(fastify: FastifyInstance) {
    // Determine if we need auth. Yes, ADMIN only.
    fastify.addHook('preHandler', authenticate);
    // fastify.addHook('preHandler', requireRole(['ADMIN'])); // Uncomment if role middleware is ready and desired

    // Get all statuses
    fastify.get('/', integrationController.getStatus);

    // WhatsApp
    fastify.get('/whatsapp', integrationController.getWhatsAppStatus);
    fastify.post('/whatsapp', integrationController.saveWhatsAppCredentials);
    fastify.get('/whatsapp/qr', integrationController.getWhatsAppQR);
    fastify.post('/whatsapp/test', integrationController.testWhatsAppMessage);
    fastify.post('/whatsapp/disconnect', integrationController.disconnectWhatsApp);

    // AmoCRM
    fastify.get('/amocrm', integrationController.getAmoCRMStatus);
    fastify.post('/amocrm', integrationController.saveAmoCRMCredentials);
    fastify.post('/amocrm/callback', integrationController.handleAmoCRMCallback);
    fastify.get('/amocrm/callback', integrationController.handleAmoCRMCallback);
    fastify.post('/amocrm/sync', integrationController.syncAmoCRMPipelines);
    fastify.post('/amocrm/disconnect', integrationController.disconnectAmoCRM);
}

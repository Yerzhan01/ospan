import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../common/utils/logger.js';
import { amoCRMService } from './amocrm.service.js';

export async function amocrmWebhook(app: FastifyInstance) {
    app.post('/webhook/amocrm', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as any;
        logger.info({ body }, 'Incoming AmoCRM Webhook');

        try {
            // Check for status change event
            if (body.leads && body.leads.status) {
                for (const lead of body.leads.status) {
                    const leadId = parseInt(lead.id);
                    const newStatusId = parseInt(lead.status_id);
                    const pipelineId = parseInt(lead.pipeline_id);

                    logger.info({ leadId, newStatusId, pipelineId }, 'Lead status changed in CRM');

                    // Helper logic to sync back to App?
                    // e.g. update PeriodStatus if matching
                }
            }

            return reply.send({ status: 'ok' });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error handling AmoCRM webhook');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}

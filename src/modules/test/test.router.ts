import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { aiService } from '../../integrations/ai/ai.service.js';
import { config } from '../../config/index.js';

export async function testRoutes(app: FastifyInstance) {

    // Only allow in development or specific environment
    if (config.env === 'production') {
        return;
    }

    app.post('/test/analyze', async (request: FastifyRequest<{ Body: { text: string, patientId: string } }>, reply: FastifyReply) => {
        const { text, patientId } = request.body;

        try {
            const result = await aiService.analyzeTextResponse(text, patientId);
            return reply.send(result);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

}

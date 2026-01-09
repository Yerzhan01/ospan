import { FastifyRequest, FastifyReply } from 'fastify';
import { integrationService } from './integration.service.js';
import {
    SaveWhatsAppCredentialsDto,
    SaveAmoCRMCredentialsDto,
    TestWhatsAppMessageDto,
    SaveOpenAICredentialsDto
} from './integration.types.js';
import { config } from '../../config/index.js';

export class IntegrationController {

    async getStatus(request: FastifyRequest, reply: FastifyReply) {
        const statuses = await integrationService.getAllIntegrations();
        return reply.send(statuses);
    }

    // ===== WhatsApp =====

    async getWhatsAppStatus(request: FastifyRequest, reply: FastifyReply) {
        const status = await integrationService.getWhatsAppStatus();
        return reply.send(status);
    }

    async saveWhatsAppCredentials(request: FastifyRequest<{ Body: SaveWhatsAppCredentialsDto }>, reply: FastifyReply) {
        const status = await integrationService.saveWhatsAppCredentials(request.body);
        return reply.send(status);
    }

    async getWhatsAppQR(request: FastifyRequest, reply: FastifyReply) {
        const qr = await integrationService.getWhatsAppQR();
        if (!qr) {
            return reply.status(404).send({ message: 'QR code not available (check if instance is authorized or configured)' });
        }
        return reply.send(qr);
    }

    async testWhatsAppMessage(request: FastifyRequest<{ Body: TestWhatsAppMessageDto }>, reply: FastifyReply) {
        const result = await integrationService.testWhatsAppMessage(request.body);
        if (!result) {
            return reply.status(500).send({ message: 'Failed to send test message' });
        }
        return reply.send(result);
    }

    async disconnectWhatsApp(request: FastifyRequest, reply: FastifyReply) {
        await integrationService.disconnectWhatsApp();
        return reply.send({ success: true });
    }

    // ===== OpenAI =====

    async saveOpenAICredentials(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
        // Body should match SaveOpenAICredentialsDto but using any to avoid import loop or quick fix
        const result = await integrationService.saveOpenAICredentials(request.body as SaveOpenAICredentialsDto);
        return reply.send(result);
    }

    async disconnectOpenAI(request: FastifyRequest, reply: FastifyReply) {
        await integrationService.disconnectOpenAI();
        return reply.send({ success: true });
    }

    // ===== AmoCRM =====

    async getAmoCRMStatus(request: FastifyRequest, reply: FastifyReply) {
        const status = await integrationService.getAmoCRMStatus();
        return reply.send(status);
    }

    async saveAmoCRMCredentials(request: FastifyRequest<{ Body: SaveAmoCRMCredentialsDto }>, reply: FastifyReply) {
        const result = await integrationService.saveAmoCRMCredentials(request.body);
        return reply.send(result);
    }

    async handleAmoCRMCallback(request: FastifyRequest<{ Body: { code: string }; Querystring: { code: string } }>, reply: FastifyReply) {
        const code = request.query?.code || request.body?.code;

        if (!code) {
            return reply.status(400).send({ message: 'Code is required' });
        }

        try {
            const tokens = await integrationService.handleAmoCRMCallback(code);
            // Redirect to settings page on success if it's a GET request (browser flow)
            if (request.method === 'GET') {
                return reply.redirect(`${config.frontendUrl}/settings/integrations?amo_success=true`);
            }
            return reply.send(tokens);
        } catch (error) {
            if (request.method === 'GET') {
                return reply.redirect(`${config.frontendUrl}/settings/integrations?amo_error=true`);
            }
            throw error;
        }
    }

    async syncAmoCRMPipelines(request: FastifyRequest, reply: FastifyReply) {
        const pipelines = await integrationService.syncAmoCRMPipelines();
        return reply.send(pipelines);
    }

    async saveAmoCRMMapping(request: FastifyRequest<{ Body: { mapping: Record<string, number> } }>, reply: FastifyReply) {
        const mapping = await integrationService.saveAmoCRMMapping(request.body.mapping);
        return reply.send({ success: true, mapping });
    }

    async disconnectAmoCRM(request: FastifyRequest, reply: FastifyReply) {
        await integrationService.disconnectAmoCRM();
        return reply.send({ success: true });
    }
}

export const integrationController = new IntegrationController();

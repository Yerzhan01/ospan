import { FastifyRequest, FastifyReply } from 'fastify';
import { alertService } from './alert.service.js';
import { AlertStatus, AlertType, RiskLevel } from '@prisma/client';
import { AlertFilters, CreateAlertDto, UpdateAlertDto } from './alert.types.js';

class AlertController {

    // GET /api/v1/alerts
    async list(
        request: FastifyRequest<{
            Querystring: AlertFilters & { page?: number; limit?: number }
        }>,
        reply: FastifyReply
    ) {
        const { page, limit, ...filters } = request.query;
        // Optional: restrict by user role (if not admin)
        // const user = request.user; 

        const result = await alertService.list(filters, page, limit);
        return reply.send(result);
    }

    // GET /api/v1/alerts/:id
    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const alert = await alertService.findById(request.params.id);
        if (!alert) {
            return reply.status(404).send({ error: 'Alert not found' });
        }
        return reply.send(alert);
    }

    // PUT /api/v1/alerts/:id/status
    async updateStatus(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { status: AlertStatus; metadata?: any }
        }>,
        reply: FastifyReply
    ) {
        // resolvedBy could be current user ID
        const resolvedBy = (request.user as any)?.userId;

        const updated = await alertService.updateStatus(request.params.id, {
            status: request.body.status,
            resolvedBy,
            metadata: request.body.metadata
        });
        return reply.send(updated);
    }

    // POST /api/v1/alerts/:id/escalate
    async escalate(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { escalatedTo?: string }
        }>,
        reply: FastifyReply
    ) {
        const updated = await alertService.escalate(request.params.id, request.body.escalatedTo);
        return reply.send(updated);
    }

    // GET /api/v1/patients/:patientId/alerts
    async getPatientAlerts(
        request: FastifyRequest<{ Params: { patientId: string } }>,
        reply: FastifyReply
    ) {
        const alerts = await alertService.getActiveForPatient(request.params.patientId);
        return reply.send(alerts);
    }

    // GET /api/v1/alerts/stats
    async getStats(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        // If tracker, get their stats
        const userId = (request.user as any)?.userId;
        const stats = await alertService.getStatsByTracker(userId);
        return reply.send(stats);
    }
}

export const alertController = new AlertController();

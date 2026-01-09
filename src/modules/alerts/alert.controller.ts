import { FastifyRequest, FastifyReply } from 'fastify';
import { alertService } from './alert.service.js';
import { AlertStatus, AlertType, RiskLevel } from '@prisma/client';
import { AlertFilters, CreateAlertDto, UpdateAlertDto } from './alert.types.js';
import { successResponse, paginatedResponse, errorResponse } from '../../common/utils/response.js';

class AlertController {

    // GET /api/v1/alerts
    async list(
        request: FastifyRequest<{
            Querystring: AlertFilters & { page?: number; limit?: number }
        }>,
        reply: FastifyReply
    ) {
        const { page = 1, limit = 20, ...filters } = request.query;
        // Optional: restrict by user role (if not admin)
        // const user = request.user; 

        // Convert page/limit to number if they are strings (fastify schema handles this usually, but safe check)
        const pageNum = Number(page);
        const limitNum = Number(limit);

        const { items, total } = await alertService.list(filters, pageNum, limitNum);

        return reply.send(paginatedResponse(items, {
            page: pageNum,
            limit: limitNum,
            total
        }));
    }

    // GET /api/v1/alerts/:id
    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const alert = await alertService.findById(request.params.id);
        if (!alert) {
            return reply.status(404).send(errorResponse('Alert not found', 'ALERT_NOT_FOUND'));
        }
        return reply.send(successResponse(alert));
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
        return reply.send(successResponse(updated));
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
        return reply.send(successResponse(updated));
    }

    // GET /api/v1/patients/:patientId/alerts
    async getPatientAlerts(
        request: FastifyRequest<{ Params: { patientId: string } }>,
        reply: FastifyReply
    ) {
        const alerts = await alertService.getActiveForPatient(request.params.patientId);
        return reply.send(successResponse(alerts));
    }

    // GET /api/v1/alerts/stats
    async getStats(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        // If tracker, get their stats
        const userId = (request.user as any)?.userId;
        const stats = await alertService.getStatsByTracker(userId);
        return reply.send(successResponse(stats));
    }
}

export const alertController = new AlertController();

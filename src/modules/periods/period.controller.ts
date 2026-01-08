import { FastifyRequest, FastifyReply } from 'fastify';
import { PeriodService } from './period.service.js';
import {
    createPeriodSchema,
    periodIdSchema,
    completeDaySchema,
    cancelPeriodSchema
} from './period.schema.js';
import { z } from 'zod';

export class PeriodController {
    private service: PeriodService;

    constructor() {
        this.service = new PeriodService();
    }

    create = async (request: FastifyRequest, reply: FastifyReply) => {
        const body = createPeriodSchema.parse(request.body);
        const { user } = request;

        const period = await this.service.create(body, user?.userId);

        return reply.code(201).send({
            success: true,
            data: period,
        });
    };

    getById = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = periodIdSchema.parse(request.params);
        const period = await this.service.findById(id);

        return reply.send({
            success: true,
            data: period,
        });
    };

    listByPatient = async (request: FastifyRequest, reply: FastifyReply) => {
        const { patientId } = z.object({ patientId: z.string().cuid() }).parse(request.params);
        const periods = await this.service.listByPatient(patientId);

        return reply.send({
            success: true,
            data: periods,
        });
    };

    completeDay = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = periodIdSchema.parse(request.params);
        const body = completeDaySchema.parse(request.body);
        const { user } = request;

        await this.service.completeDay(id, body.dayNumber, body.completedByUserId || user?.userId);

        return reply.send({
            success: true,
            message: 'День успешно завершен',
        });
    };

    complete = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = periodIdSchema.parse(request.params);
        const { user } = request;

        await this.service.complete(id, user?.userId);

        return reply.send({
            success: true,
            message: 'Период успешно завершен',
        });
    };

    cancel = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = periodIdSchema.parse(request.params);
        const body = cancelPeriodSchema.parse(request.body);
        const { user } = request;

        await this.service.cancel(id, body.reason, user?.userId);

        return reply.send({
            success: true,
            message: 'Период отменен',
        });
    };
}

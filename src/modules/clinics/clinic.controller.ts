import { FastifyRequest, FastifyReply } from 'fastify';
import { ClinicService } from './clinic.service.js';
import {
    createClinicSchema,
    updateClinicSchema,
    clinicFiltersSchema,
    clinicIdSchema
} from './clinic.schema.js';

export class ClinicController {
    private service: ClinicService;

    constructor() {
        this.service = new ClinicService();
    }

    create = async (request: FastifyRequest, reply: FastifyReply) => {
        const body = createClinicSchema.parse(request.body);
        const { user } = request;

        const clinic = await this.service.create(body, user?.userId);

        return reply.code(201).send({
            success: true,
            data: clinic,
        });
    };

    getById = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = clinicIdSchema.parse(request.params);
        const clinic = await this.service.findById(id);

        return reply.send({
            success: true,
            data: clinic,
        });
    };

    list = async (request: FastifyRequest, reply: FastifyReply) => {
        const query = clinicFiltersSchema.parse(request.query);
        const { page, limit, ...filters } = query;

        const { items, total } = await this.service.list(filters, page, limit);

        return reply.send({
            success: true,
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    };

    update = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = clinicIdSchema.parse(request.params);
        const body = updateClinicSchema.parse(request.body);
        const { user } = request;

        const clinic = await this.service.update(id, body, user?.userId);

        return reply.send({
            success: true,
            data: clinic,
        });
    };

    delete = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = clinicIdSchema.parse(request.params);
        const { user } = request;

        await this.service.delete(id, user?.userId);

        return reply.send({
            success: true,
            data: null,
            message: 'Клиника успешно удалена',
        });
    };
}

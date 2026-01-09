import { FastifyRequest, FastifyReply } from 'fastify';
import { PatientService } from './patient.service.js';
import {
    createPatientSchema,
    updatePatientSchema,
    patientFiltersSchema,
    patientIdSchema
} from './patient.schema.js';
import { AppError } from '../../common/errors/AppError.js';

export class PatientController {
    private service: PatientService;

    constructor() {
        this.service = new PatientService();
    }

    /**
     * Создание пациента
     */
    create = async (request: FastifyRequest, reply: FastifyReply) => {
        const body = createPatientSchema.parse(request.body);
        const { user } = request;

        const patient = await this.service.create(body, user?.userId);

        return reply.code(201).send({
            success: true,
            data: patient,
        });
    };

    /**
     * Получение пациента по ID
     */
    getById = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = patientIdSchema.parse(request.params);
        const { user } = request;
        const patient = await this.service.findById(id);

        // DOCTOR can only view patients assigned to them
        if (user?.role === 'DOCTOR' && patient.doctorId !== user.userId) {
            throw new AppError('Нет доступа к данным этого пациента', 403, 'FORBIDDEN');
        }

        return reply.send({
            success: true,
            data: patient,
        });
    };

    /**
     * Список пациентов
     */
    list = async (request: FastifyRequest, reply: FastifyReply) => {
        const query = patientFiltersSchema.parse(request.query);
        const { page, limit, ...filters } = query;
        const { user } = request;

        // DOCTOR can only see their own assigned patients
        if (user?.role === 'DOCTOR') {
            filters.doctorId = user.userId;
        }
        // TRACKER can see patients assigned to them (optional - can be removed if trackers should see all)
        // if (user?.role === 'TRACKER') {
        //     filters.trackerId = user.userId;
        // }

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

    /**
     * Обновление пациента
     */
    update = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = patientIdSchema.parse(request.params);
        const body = updatePatientSchema.parse(request.body);
        const { user } = request;

        const patient = await this.service.update(id, body, user?.userId);

        return reply.send({
            success: true,
            data: patient,
        });
    };

    /**
     * Удаление пациента
     */
    delete = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = patientIdSchema.parse(request.params);
        const { user } = request;

        await this.service.delete(id, user?.userId);

        return reply.send({
            success: true,
            data: null,
            message: 'Пациент успешно удален',
        });
    };

    /**
     * Получение календаря пациента
     */
    getCalendar = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = patientIdSchema.parse(request.params);
        // Можно добавить валидацию query для periodId если нужно
        const query = request.query as { periodId?: string };

        const calendar = await this.service.getCalendar(id, query.periodId);

        return reply.send({
            success: true,
            data: calendar,
        });
    };

    /**
     * Статистика (Дашборд)
     */
    getStats = async (request: FastifyRequest, reply: FastifyReply) => {
        // Можно переиспользовать фильтры
        const query = patientFiltersSchema.parse(request.query);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { page, limit, ...filters } = query;

        const stats = await this.service.getDashboardStats(filters);

        return reply.send({
            success: true,
            data: stats,
        });
    };

    /**
     * Получение списка задач пациента
     */
    getTasks = async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = patientIdSchema.parse(request.params);

        // Check permissions (DOCTOR can only see own patients)
        const user = request.user as { userId: string; role: string; id?: string };
        const userId = user.userId || user.id;

        if (!userId) {
            throw AppError.unauthorized('User ID not found in token');
        }

        const patient = await this.service.findById(id);
        if (user?.role === 'DOCTOR' && patient.doctorId !== userId) {
            throw new AppError('Нет доступа к данным этого пациента', 403, 'FORBIDDEN');
        }

        const { taskService } = await import('../tasks/task.service.js');
        const tasks = await taskService.findByPatient(id);

        return reply.send({
            success: true,
            data: tasks,
        });
    };
}

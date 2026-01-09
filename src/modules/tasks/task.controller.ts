import { FastifyRequest, FastifyReply } from 'fastify';
import { taskService } from './task.service.js';
import { TaskStatus, TaskType } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, TaskFilters } from './task.types.js';
import { successResponse, paginatedResponse, errorResponse } from '../../common/utils/response.js';

class TaskController {

    // GET /api/v1/tasks
    async list(
        request: FastifyRequest<{
            Querystring: TaskFilters & { page?: number; limit?: number }
        }>,
        reply: FastifyReply
    ) {
        const { page = 1, limit = 20, ...filters } = request.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);

        const { items, total } = await taskService.list(filters, pageNum, limitNum);

        return reply.send(paginatedResponse(items, {
            page: pageNum,
            limit: limitNum,
            total
        }));
    }

    // GET /api/v1/tasks/my
    async getMyTasks(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const userId = (request.user as any)?.userId;
        if (!userId) {
            return reply.status(400).send(errorResponse('User ID not found', 'USER_ID_MISSING'));
        }
        const result = await taskService.getMyTasks(userId);
        return reply.send(successResponse(result));
    }

    // GET /api/v1/tasks/:id
    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const task = await taskService.findById(request.params.id);
        if (!task) {
            return reply.status(404).send(errorResponse('Task not found', 'TASK_NOT_FOUND'));
        }
        return reply.send(successResponse(task));
    }

    // POST /api/v1/tasks
    async create(
        request: FastifyRequest<{ Body: CreateTaskDto }>,
        reply: FastifyReply
    ) {
        // Enforce validations if needed
        const task = await taskService.create(request.body);
        return reply.status(201).send(successResponse(task));
    }

    // PUT /api/v1/tasks/:id/status
    async updateStatus(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { status: TaskStatus }
        }>,
        reply: FastifyReply
    ) {
        const userId = (request.user as any)?.userId; // Who updated it
        const task = await taskService.updateStatus(request.params.id, request.body.status, userId);
        return reply.send(successResponse(task));
    }

    // PUT /api/v1/tasks/:id/reassign
    async reassign(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { assignedToId: string }
        }>,
        reply: FastifyReply
    ) {
        const task = await taskService.reassign(request.params.id, request.body.assignedToId);
        return reply.send(successResponse(task));
    }

    // PUT /api/v1/tasks/:id
    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateTaskDto
        }>,
        reply: FastifyReply
    ) {
        const task = await taskService.update(request.params.id, request.body);
        return reply.send(successResponse(task));
    }
}


export const taskController = new TaskController();

import { TaskStatus, TaskType, Prisma } from '@prisma/client';
import { getPrisma } from '../../config/database.js';
import { logger } from '../../common/utils/logger.js';
import { CreateTaskDto, UpdateTaskDto, TaskFilters, TaskWithRelations } from './task.types.js';
import { whatsappService } from '../../integrations/whatsapp/whatsapp.service.js';
import dayjs from 'dayjs';

export class TaskService {

    /**
     * Create a new task and notify assignee
     */
    async create(data: CreateTaskDto): Promise<TaskWithRelations> {
        const prisma = await getPrisma();

        const task = await prisma.task.create({
            data: {
                ...data,
                status: TaskStatus.PENDING,
                priority: data.priority ?? 0
            },
            include: {
                patient: true,
                assignedTo: true,
                alert: true
            }
        });

        // Notify Assignee (if they have phone and it's urgent?)
        // Simple notification logic
        if (task.assignedTo.phone) {
            const message = `📋 *New Task Assigned*\n${task.title}\nPatient: ${task.patient.fullName}\nPriority: ${task.priority}`;
            await whatsappService.sendMessage(task.assignedTo.phone, message).catch(err => {
                logger.warn({ err }, 'Failed to notify assignee about new task');
            });
        }

        logger.info({ taskId: task.id }, 'Task created');
        return task as unknown as TaskWithRelations;
    }

    /**
     * Find task by ID
     */
    async findById(id: string): Promise<TaskWithRelations | null> {
        const prisma = await getPrisma();
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                patient: true,
                assignedTo: true,
                alert: true
            }
        });
        return task as unknown as TaskWithRelations;
    }

    /**
     * List tasks with filters
     */
    async list(filters: TaskFilters = {}, page = 1, limit = 20) {
        const prisma = await getPrisma();
        const where: Prisma.TaskWhereInput = {};

        if (filters.assignedToId) where.assignedToId = filters.assignedToId;
        if (filters.patientId) where.patientId = filters.patientId;
        if (filters.status) where.status = filters.status;
        if (filters.type) where.type = filters.type;

        if (filters.isOverdue) {
            where.dueDate = { lt: new Date() };
            where.status = { not: TaskStatus.COMPLETED };
        }

        const [items, total] = await Promise.all([
            prisma.task.findMany({
                where,
                take: limit,
                skip: (page - 1) * limit,
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' }
                ],
                include: {
                    patient: true,
                    assignedTo: true
                }
            }),
            prisma.task.count({ where })
        ]);

        return { items, total, page, limit };
    }

    /**
     * Get tasks for a specific user grouped by urgency
     */
    async getMyTasks(userId: string) {
        const prisma = await getPrisma();
        const now = new Date();
        const startOfToday = dayjs().startOf('day').toDate();
        const endOfToday = dayjs().endOf('day').toDate();

        const allTasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                status: { not: TaskStatus.COMPLETED } // Only pending/in_progress
            },
            include: { patient: true },
            orderBy: { dueDate: 'asc' }
        });

        // Grouping
        const overdue = allTasks.filter(t => t.dueDate && t.dueDate < now);
        const today = allTasks.filter(t => t.dueDate && t.dueDate >= startOfToday && t.dueDate <= endOfToday);
        const upcoming = allTasks.filter(t => !t.dueDate || t.dueDate > endOfToday);

        return {
            overdue,
            today,
            upcoming
        };
    }

    /**
     * Update task status
     */
    async updateStatus(id: string, status: TaskStatus, userId: string): Promise<TaskWithRelations> {
        const prisma = await getPrisma();

        const updateData: any = { status };
        if (status === TaskStatus.COMPLETED) {
            updateData.completedAt = new Date();
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                patient: true,
                assignedTo: true,
                alert: true
            }
        });

        // If task linked to Alert, check if we should resolve alert?
        // Usually alert resolution is separate, but maybe prompt user?
        // Leaving independent for now.

        return task as unknown as TaskWithRelations;
    }

    /**
     * Reassign task
     */
    async reassign(id: string, newAssigneeId: string): Promise<TaskWithRelations> {
        const prisma = await getPrisma();

        const task = await prisma.task.update({
            where: { id },
            data: { assignedToId: newAssigneeId },
            include: {
                patient: true,
                assignedTo: true, // This captures new assignee
                alert: true
            }
        });

        // Notify New Assignee
        if (task.assignedTo.phone) {
            const message = `📋 *Task Reassigned to You*\n${task.title}\nPatient: ${task.patient.fullName}`;
            await whatsappService.sendMessage(task.assignedTo.phone, message).catch(err => {
                logger.warn({ err }, 'Failed to notify new assignee');
            });
        }

        return task as unknown as TaskWithRelations;
    }

    /**
     * Get overdue tasks (system use)
     */
    async getOverdueTasks() {
        const prisma = await getPrisma();
        return prisma.task.findMany({
            where: {
                status: { not: TaskStatus.COMPLETED },
                dueDate: { lt: new Date() }
            },
            include: { assignedTo: true }
        });
    }
}

export const taskService = new TaskService();

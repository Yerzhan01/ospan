import { Task, TaskStatus, TaskType, Prisma } from '@prisma/client';

export interface CreateTaskDto {
    type: TaskType;
    title: string;
    description?: string;
    priority?: number; // 0-10
    dueDate?: Date | string;
    patientId: string;
    assignedToId: string;
    alertId?: string;
    metadata?: any;
    amoCrmTaskId?: string;
}

export interface UpdateTaskDto {
    status?: TaskStatus;
    priority?: number;
    dueDate?: Date | string;
    assignedToId?: string; // Reassignment
    description?: string;
    metadata?: any;
}

export interface TaskFilters {
    assignedToId?: string;
    patientId?: string;
    status?: TaskStatus;
    type?: TaskType;
    isOverdue?: boolean;
}

export type TaskWithRelations = Task & {
    patient: {
        id: string;
        fullName: string;
        phone: string;
    };
    assignedTo: {
        id: string;
        fullName: string;
        email: string;
    };
    alert?: {
        id: string;
        type: string;
        riskLevel: string;
    } | null;
};

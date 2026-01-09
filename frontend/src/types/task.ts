export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskType = 'FOLLOW_UP' | 'CALL' | 'MESSAGE' | 'OTHER';

export interface Task {
    id: string;
    type: TaskType;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: number; // 0-10
    dueDate: string; // ISO Date
    completedAt: string | null;
    patientId: string;
    assignedToId: string;
    createdById: string;
    alertId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    patient?: {
        id: string;
        fullName: string;
        phone: string;
    } | null;
    assignedTo?: {
        id: string;
        fullName: string;
    } | null;
    alert?: {
        id: string;
        riskLevel: string;
    } | null;
}

export interface TaskFilters {
    assignedToId?: string; // "me" or specific ID
    status?: TaskStatus | 'all';
    type?: TaskType;
    isOverdue?: boolean;
    patientId?: string;
    page?: number;
    limit?: number;
}

export interface UpdateTaskDto {
    status?: TaskStatus;
    // other fields omitted for simple status update usage
}

import { AlertStatus, Prisma, TaskType, AlertType, TaskStatus } from '@prisma/client';
import { getPrisma } from '../../config/database.js';
import { logger } from '../../common/utils/logger.js';
import { AlertWithDetails, CreateAlertDto, UpdateAlertDto, AlertFilters } from './alert.types.js';
import { alertNotificationService } from './alert.notifications.js';

export class AlertService {

    /**
     * Determine TaskType based on AlertType
     */
    private getTaskTypeForAlert(alertType: AlertType): TaskType {
        switch (alertType) {
            case AlertType.MISSED_RESPONSE:
                return TaskType.CALL;
            case AlertType.NO_PHOTO:
                return TaskType.CHECK_PHOTO;
            case AlertType.BAD_CONDITION:
                return TaskType.ESCALATE;
            default:
                return TaskType.CUSTOM;
        }
    }

    /**
     * Create a new alert and assign a task to the tracker
     */
    async create(data: CreateAlertDto): Promise<AlertWithDetails> {
        const prisma = await getPrisma();

        // 1. Create Alert
        const alert = await prisma.alert.create({
            data: {
                ...data,
                status: AlertStatus.NEW
            },
            include: {
                patient: true,
                answer: true
            }
        });

        // 2. Create Task for Tracker (if assigned)
        if (alert.patient.trackerId) {
            // Default dueDate: +1 day for reaction
            const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await prisma.task.create({
                data: {
                    type: this.getTaskTypeForAlert(data.type),
                    title: `Handle Alert: ${data.title}`,
                    description: data.description,
                    priority: data.riskLevel === 'CRITICAL' ? 10 : 5,
                    patientId: data.patientId,
                    assignedToId: alert.patient.trackerId,
                    alertId: alert.id,
                    status: 'PENDING',
                    dueDate
                }
            });

            // 3. Notify Tracker
            // We cast to AlertWithDetails safely as we included patient/answer
            await alertNotificationService.notifyTracker(alert as unknown as AlertWithDetails);
        }

        // Emit Event
        const { eventBus, AppEvents } = await import('../../common/events/events.js');
        eventBus.emit(AppEvents.ALERT_CREATED, {
            alertId: alert.id,
            patientId: alert.patientId,
            type: alert.type,
            riskLevel: alert.riskLevel
        });

        logger.info({ alertId: alert.id }, 'Alert created');
        return alert as unknown as AlertWithDetails;
    }
    async findById(id: string): Promise<AlertWithDetails | null> {
        const prisma = await getPrisma();
        const alert = await prisma.alert.findUnique({
            where: { id },
            include: {
                patient: true,
                answer: true,
                tasks: true
            }
        });
        return alert as unknown as AlertWithDetails;
    }

    /**
     * List alerts with filters
     */
    async list(filters: AlertFilters = {}, page = 1, limit = 20) {
        const prisma = await getPrisma();
        const where: Prisma.AlertWhereInput = {};

        if (filters.patientId) where.patientId = filters.patientId;
        if (filters.type) where.type = filters.type;
        if (filters.status) where.status = filters.status;
        if (filters.riskLevel) where.riskLevel = filters.riskLevel;
        if (filters.assignedTo) {
            // Filter by patients assigned to tracker
            where.patient = { trackerId: filters.assignedTo };
        }

        const [items, total] = await Promise.all([
            prisma.alert.findMany({
                where,
                take: limit,
                skip: (page - 1) * limit,
                orderBy: [
                    { riskLevel: 'desc' }, // Critical first
                    { createdAt: 'desc' }
                ],
                include: { patient: true }
            }),
            prisma.alert.count({ where })
        ]);

        return { items, total, page, limit };
    }

    /**
     * Update alert status
     */
    async updateStatus(id: string, data: UpdateAlertDto): Promise<AlertWithDetails> {
        const prisma = await getPrisma();
        const updateData: any = { status: data.status };

        if (data.status === AlertStatus.RESOLVED) {
            updateData.resolvedBy = data.resolvedBy;
            updateData.resolvedAt = new Date();
        }

        if (data.metadata) {
            // Check how to merge metadata? Prisma replaces Json.
            // For now replace
            updateData.metadata = data.metadata;
        }

        const alert = await prisma.alert.update({
            where: { id },
            data: updateData,
            include: { patient: true, answer: true }
        });

        // Auto-complete related tasks when alert is resolved
        if (data.status === AlertStatus.RESOLVED) {
            await prisma.task.updateMany({
                where: {
                    alertId: id,
                    status: { not: TaskStatus.COMPLETED }
                },
                data: {
                    status: TaskStatus.COMPLETED,
                    completedAt: new Date()
                }
            });
            logger.info({ alertId: id }, 'Auto-completed related tasks on alert resolve');
        }

        return alert as unknown as AlertWithDetails;
    }

    /**
     * Escalate alert to Doctor
     */
    async escalate(id: string, escalatedTo?: string): Promise<AlertWithDetails> {
        const prisma = await getPrisma();

        const alert = await prisma.alert.findUnique({ where: { id }, include: { patient: true } });
        if (!alert) throw new Error('Alert not found');

        const doctorId = escalatedTo || alert.patient.doctorId;
        if (!doctorId) throw new Error('No doctor to escalate to');

        // Cancel tracker's task before creating doctor's task
        await prisma.task.updateMany({
            where: { alertId: id, status: TaskStatus.PENDING },
            data: { status: TaskStatus.CANCELLED }
        });
        logger.info({ alertId: id }, 'Cancelled tracker task on escalation');

        // Update status
        const updatedAlert = await prisma.alert.update({
            where: { id },
            data: { status: AlertStatus.ESCALATED },
            include: { patient: true, answer: true }
        });

        // Create Task for Doctor with dueDate
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.task.create({
            data: {
                type: TaskType.ESCALATE,
                title: `ESCALATED: ${alert.title}`,
                description: alert.description,
                priority: 10, // Max priority
                patientId: alert.patientId,
                assignedToId: doctorId,
                alertId: alert.id,
                status: 'PENDING',
                dueDate
            }
        });

        // Notify Doctor
        await alertNotificationService.notifyDoctor(updatedAlert as unknown as AlertWithDetails);

        return updatedAlert as unknown as AlertWithDetails;
    }

    async getActiveForPatient(patientId: string) {
        const prisma = await getPrisma();
        return prisma.alert.findMany({
            where: {
                patientId,
                status: { not: AlertStatus.RESOLVED }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getStatsByTracker(trackerId: string) {
        const prisma = await getPrisma();
        const { default: dayjs } = await import('dayjs');

        // 1. Count by status
        const stats = await prisma.alert.groupBy({
            by: ['status'],
            where: {
                patient: { trackerId }
            },
            _count: true
        });

        const statusCounts = stats.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {} as Record<string, number>);

        // 2b. Count by Risk Level
        const riskStats = await prisma.alert.groupBy({
            by: ['riskLevel'],
            where: {
                patient: { trackerId },
                status: { not: 'RESOLVED' } // Only open alerts
            },
            _count: true
        });

        const riskCounts = riskStats.reduce((acc, curr) => {
            acc[curr.riskLevel] = curr._count;
            return acc;
        }, {} as Record<string, number>);

        // 3. Calculate Average Average  Reaction Time
        // Alerts that are no longer NEW implies they have been processed
        const reactedAlerts = await prisma.alert.findMany({
            where: {
                patient: { trackerId },
                status: { not: 'NEW' }
            },
            select: { createdAt: true, updatedAt: true }
        });

        let avgReactionMinutes = 0;
        if (reactedAlerts.length > 0) {
            const totalMinutes = reactedAlerts.reduce((sum, alert) => {
                return sum + dayjs(alert.updatedAt).diff(dayjs(alert.createdAt), 'minute');
            }, 0);
            avgReactionMinutes = Math.round(totalMinutes / reactedAlerts.length);
        }

        return {
            ...statusCounts,
            ...riskCounts, // e.g. CRITICAL: 5
            avgReactionMinutes
        };
    }
}

export const alertService = new AlertService();

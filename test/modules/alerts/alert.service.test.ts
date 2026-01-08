import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../utils/prisma.mock';
import { alertService } from '@/modules/alerts/alert.service';
import { AlertStatus, RiskLevel, AlertType } from '@prisma/client';

// Mock dependencies
vi.mock('@/modules/alerts/alert.notifications.js', () => ({
    alertNotificationService: {
        notifyTracker: vi.fn(),
        notifyDoctor: vi.fn()
    }
}));

describe('AlertService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new alert', async () => {
            const mockData = {
                patientId: 'patient-1',
                type: AlertType.BAD_CONDITION,
                title: 'Patient feels bad',
                description: 'Dizziness reported',
                riskLevel: RiskLevel.HIGH,
                triggeredBy: 'system'
            };

            const createdAlert = {
                id: 'alert-1',
                ...mockData,
                status: AlertStatus.NEW,
                answerId: null,
                resolvedBy: null,
                resolvedAt: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                patient: { trackerId: 'tracker-1' }
            };

            prismaMock.alert.create.mockResolvedValue(createdAlert as any);
            prismaMock.task.create.mockResolvedValue({} as any);

            const result = await alertService.create(mockData);

            expect(result).toEqual(createdAlert);
            expect(prismaMock.alert.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    patientId: mockData.patientId,
                    riskLevel: mockData.riskLevel,
                    status: AlertStatus.NEW
                }),
                include: { patient: true, answer: true }
            });
        });
    });

    describe('updateStatus', () => {
        it('should update alert status', async () => {
            const alertId = 'alert-1';
            const status = AlertStatus.IN_PROGRESS;
            const updatedAlert = {
                id: alertId,
                status,
                resolvedBy: null
            };

            prismaMock.alert.update.mockResolvedValue(updatedAlert as any);

            await alertService.updateStatus(alertId, { status } as any);

            expect(prismaMock.alert.update).toHaveBeenCalledWith({
                where: { id: alertId },
                data: expect.objectContaining({ status }),
                include: expect.any(Object)
            });
        });
    });
});

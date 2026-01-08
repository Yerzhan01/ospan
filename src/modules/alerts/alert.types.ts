import { Alert, RiskLevel, AlertType, AlertStatus } from '@prisma/client';

export interface CreateAlertDto {
    patientId: string;
    type: AlertType;
    title: string;
    description?: string;
    riskLevel: RiskLevel;
    answerId?: string;
    triggeredBy: string; // 'system' or userId
    metadata?: any;
}

export interface UpdateAlertDto {
    status?: AlertStatus;
    resolvedBy?: string;
    metadata?: any;
}

export interface AlertFilters {
    patientId?: string;
    type?: AlertType;
    status?: AlertStatus;
    riskLevel?: RiskLevel;
    assignedTo?: string; // trackerId
}

export type AlertWithDetails = Alert & {
    patient: {
        id: string;
        fullName: string;
        phone: string;
        trackerId: string | null;
        doctorId: string | null;
    };
    answer?: {
        id: string;
        dayNumber: number;
        timeSlot: string; // Enum actually
    } | null;
};

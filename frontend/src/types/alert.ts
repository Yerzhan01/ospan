export type AlertType = 'MISSED_DAILY' | 'BAD_FEELING' | 'MISSED_MEDICATION' | 'SYMPTOM_REPORT' | 'OTHER';
export type AlertStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
    id: string;
    type: AlertType;
    title: string;
    description: string | null;
    riskLevel: RiskLevel;
    status: AlertStatus;
    patientId: string;
    answerId: string | null;
    triggeredBy: string;
    resolvedBy: string | null;
    resolvedAt: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    patient?: {
        id: string;
        fullName: string;
        phone: string;
        trackerId: string | null;
        doctorId: string | null;
    };
    answer?: {
        id: string;
        dayNumber: number;
        timeSlot: string;
    } | null;
}

export interface AlertFilters {
    patientId?: string;
    type?: AlertType;
    status?: AlertStatus | 'all';
    riskLevel?: RiskLevel;
    assignedTo?: string; // trackerId
    page?: number;
    limit?: number;
}

export interface UpdateAlertStatusDto {
    status: AlertStatus;
    resolvedBy?: string;
}

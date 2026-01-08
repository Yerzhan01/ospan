import { EventEmitter } from 'events';

export enum AppEvents {
    PATIENT_CREATED = 'patient.created',
    PERIOD_STARTED = 'period.started',
    PERIOD_COMPLETED = 'period.completed',
    ALERT_CREATED = 'alert.created',
    VISIT_COMPLETED = 'visit.completed',
    PROGRAM_COMPLETED = 'program.completed'
}

export interface PatientCreatedPayload {
    patientId: string;
}

export interface PeriodStartedPayload {
    periodId: string;
    patientId: string;
}

export interface PeriodCompletedPayload {
    periodId: string;
    patientId: string;
}

export interface AlertCreatedPayload {
    alertId: string;
    patientId: string;
    type: string;
    riskLevel: string;
}

class AppEventBus extends EventEmitter {
    emit(event: AppEvents.PATIENT_CREATED, payload: PatientCreatedPayload): boolean;
    emit(event: AppEvents.PERIOD_STARTED, payload: PeriodStartedPayload): boolean;
    emit(event: AppEvents.PERIOD_COMPLETED, payload: PeriodCompletedPayload): boolean;
    emit(event: AppEvents.ALERT_CREATED, payload: AlertCreatedPayload): boolean;
    emit(event: string | symbol, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }
}

export const eventBus = new AppEventBus();

import { amoCRMService } from './amocrm.service.js';
import { logger } from '../../common/utils/logger.js';
import { PeriodStatus } from '@prisma/client';
import { AMO_MAPPING } from './amocrm.mapping.js';
import {
    PatientCreatedPayload,
    PeriodStartedPayload,
    PeriodCompletedPayload,
    AlertCreatedPayload
} from '../../common/events/events.js';
import { getPrisma } from '../../config/database.js';

export class AmoCRMAutomationService {

    /**
     * Handle Patient Created: Create Lead and Contact
     */
    async processPatientCreated(payload: PatientCreatedPayload) {
        const prisma = await getPrisma();
        const patient = await prisma.patient.findUnique({ where: { id: payload.patientId } });
        if (!patient) return;

        logger.info({ patientId: patient.id }, 'Processing processPatientCreated for AmoCRM');

        try {
            // Create lead
            const leadId = await amoCRMService.createLead(patient.fullName, patient.phone);
            if (leadId) {
                await prisma.patient.update({
                    where: { id: patient.id },
                    data: { amoCrmLeadId: leadId.toString() } // Convert to string
                });
            }
        } catch (error) {
            logger.error({ error, patientId: patient.id }, 'Failed to sync Patient to AmoCRM');
        }
    }

    /**
     * Handle Period Started: Move Lead to corresponding pipeline stage
     */
    async processPeriodStarted(payload: PeriodStartedPayload) {
        const prisma = await getPrisma();
        const period = await prisma.period.findUnique({
            where: { id: payload.periodId },
            include: { patient: true }
        });

        if (!period || !period.patient.amoCrmLeadId) return;

        logger.info({ periodId: period.id }, 'Processing processPeriodStarted for AmoCRM');

        // Determine pipeline/status based on period type/status
        // Example: Mapping "ADAPTATION" -> Specific Pipeline Stage
        // For now, basic logic:

        // If customization needed, use `period.type`

        // Update lead status logic here
        // const statusId = MAPPED_STATUS_ID;
        // await amoCRMService.updateLeadStatus(period.patient.amoCrmLeadId, statusId);
    }

    /**
     * Handle Period Completed: Move to next stage
     */
    async processPeriodCompleted(payload: PeriodCompletedPayload) {
        // Logic to move lead forward
    }

    /**
     * Handle Alert Created: Create Task in CRM
     */
    async processAlertCreated(payload: AlertCreatedPayload) {
        const prisma = await getPrisma();
        const patient = await prisma.patient.findUnique({ where: { id: payload.patientId } });

        if (!patient || !patient.amoCrmLeadId) return;

        if (payload.riskLevel === 'HIGH' || payload.riskLevel === 'CRITICAL') {
            await amoCRMService.createTask(
                `URGENT: ${payload.type} Alert. Risk: ${payload.riskLevel}`,
                parseInt(patient.amoCrmLeadId) // Convert back to number
            );
        }
    }
}

export const amoCRMAutomationService = new AmoCRMAutomationService();

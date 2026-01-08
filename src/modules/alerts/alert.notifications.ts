import { AlertWithDetails } from './alert.types.js';
import { whatsappService } from '../../integrations/whatsapp/whatsapp.service.js';
import { logger } from '../../common/utils/logger.js';
import { getPrisma } from '../../config/database.js';

export class AlertNotificationService {

    /**
     * Notifies the Tracker about a new alert
     */
    async notifyTracker(alert: AlertWithDetails) {
        if (!alert.patient.trackerId) {
            logger.warn({ alertId: alert.id }, 'No tracker assigned to patient, skipping notification');
            return;
        }

        const prisma = await getPrisma();
        const tracker = await prisma.user.findUnique({
            where: { id: alert.patient.trackerId }
        });

        if (!tracker || !tracker.phone) {
            logger.warn({ trackerId: alert.patient.trackerId }, 'Tracker not found or has no phone');
            return;
        }

        const message = `⚠️ *Alert created*\nPatient: ${alert.patient.fullName}\nTitle: ${alert.title}\nRisk: ${alert.riskLevel}\nType: ${alert.type}`;

        try {
            await whatsappService.sendMessage(tracker.phone, message);
            logger.info({ alertId: alert.id, trackerId: tracker.id }, 'Tracker notified via WhatsApp');
        } catch (error) {
            logger.error({ error, alertId: alert.id }, 'Failed to notify tracker');
        }
    }

    /**
     * Notifies the Doctor (Escalation)
     */
    async notifyDoctor(alert: AlertWithDetails) {
        if (!alert.patient.doctorId) {
            logger.warn({ alertId: alert.id }, 'No doctor assigned to patient, skipping notification');
            return;
        }

        const prisma = await getPrisma();
        const doctor = await prisma.user.findUnique({
            where: { id: alert.patient.doctorId }
        });

        if (!doctor || !doctor.phone) {
            logger.warn({ doctorId: alert.patient.doctorId }, 'Doctor not found or has no phone');
            return;
        }

        const message = `🚨 *ESCALATION REQUIRED*\nPatient: ${alert.patient.fullName}\nIssue: ${alert.title}\nRisk: ${alert.riskLevel}\n\nPlease check the dashboard.`;

        try {
            await whatsappService.sendMessage(doctor.phone, message);
            logger.info({ alertId: alert.id, doctorId: doctor.id }, 'Doctor notified via WhatsApp');
        } catch (error) {
            logger.error({ error, alertId: alert.id }, 'Failed to notify doctor');
        }
    }
}

export const alertNotificationService = new AlertNotificationService();

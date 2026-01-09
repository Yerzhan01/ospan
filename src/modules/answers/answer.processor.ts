import { getPrisma } from '../../config/database.js';
import { logger } from '../../common/utils/logger.js';
import { aiService } from '../../integrations/ai/ai.service.js';
import { RiskLevel, AlertType } from '@prisma/client';
import { amoCRMService } from '../../integrations/amocrm/amocrm.service.js';

export class AnswerProcessor {
    /**
     * Main entry point for processing an answer
     */
    async processAnswer(answerId: string): Promise<void> {
        const prisma = await getPrisma();
        logger.info({ answerId }, 'Starting answer processing');

        try {
            // 1. Fetch Answer with related data
            const answer = await prisma.answer.findUnique({
                where: { id: answerId },
                include: {
                    patient: true,
                    questionTemplate: true
                }
            });

            if (!answer) {
                logger.error({ answerId }, 'Answer not found');
                return;
            }

            if (answer.isProcessed) {
                logger.info({ answerId }, 'Answer already processed');
                return;
            }

            // 2. Perform AI Analysis
            let analysisResult;
            try {
                if (answer.photoUrl) {
                    analysisResult = await aiService.analyzePhotoResponse(
                        answer.photoUrl,
                        answer.textContent || '',
                        answer.patientId
                    );
                } else {
                    analysisResult = await aiService.analyzeTextResponse(
                        answer.textContent || '',
                        answer.patientId
                    );
                }
            } catch (aiError: any) {
                logger.error({ answerId, error: aiError.message }, 'AI Service failed');
                // We might want to mark as failed or retry?
                // For now just throw to let Queue retry
                throw aiError;
            }

            // 3. Update Answer with results
            await prisma.answer.update({
                where: { id: answerId },
                data: {
                    isProcessed: true,
                    riskLevel: analysisResult.riskLevel,
                    aiAnalysis: analysisResult as any, // Cast to Json
                }
            });

            // 4. Handle Alerts
            if (analysisResult.shouldAlert) {
                await this.createAlert(answer, analysisResult);
            }

            // 5. Check if day is complete (optional logic could go here)
            // e.g., if all questions for the day are answered

            logger.info({
                answerId,
                risk: analysisResult.riskLevel,
                alert: analysisResult.shouldAlert
            }, 'Answer processing completed');

        } catch (error: any) {
            logger.error({ answerId, error: error.message }, 'Error in AnswerProcessor');
            throw error; // Re-throw to allow Queue retry
        }
    }

    private async createAlert(answer: any, analysisResult: any) {
        // Use AlertService to ensure task creation and notifications
        const { alertService } = await import('../alerts/alert.service.js');
        const { AlertType, RiskLevel } = await import('@prisma/client');

        const alert = await alertService.create({
            patientId: answer.patientId,
            type: AlertType.BAD_CONDITION,
            riskLevel: analysisResult.riskLevel as RiskLevel,
            title: 'High Risk Answer Detected',
            description: analysisResult.summary || analysisResult.alertReason || 'High risk detected by AI',
            triggeredBy: 'system',
            answerId: answer.id,
            metadata: analysisResult
        });

        logger.warn({
            patientId: answer.patientId,
            risk: analysisResult.riskLevel
        }, 'Clinical Alert created');

        // Create Task in AmoCRM if High Risk
        if (analysisResult.riskLevel === 'HIGH' || analysisResult.riskLevel === 'CRITICAL') {
            try {
                const prisma = await getPrisma();
                // Fetch patient to get AmoCRM ID
                const patient = await prisma.patient.findUnique({
                    where: { id: answer.patientId }
                });

                if (patient && patient.amoCrmLeadId) {
                    await amoCRMService.createTask(
                        `ALARM: High risk detected! \n${alert.description}`,
                        Number(patient.amoCrmLeadId),
                        patient.trackerId ? undefined : undefined
                    );
                    logger.info({ patientId: patient.id }, 'AmoCRM Task created for High Risk Alert');
                }
            } catch (error) {
                logger.error({ err: error }, 'Failed to create AmoCRM task for alert');
            }
        }
    }
}

export const answerProcessor = new AnswerProcessor();

import { AIProviderFactory } from './ai.provider.js';
import { aiConfig } from './ai.config.js';
import { AnalysisResult } from './ai.types.js';
import { SYSTEM_PROMPT_MEDICAL_ANALYSIS, PROMPT_PHOTO_ANALYSIS } from './ai.prompts.js';
import { getPrisma } from '../../config/database.js';
import { logger } from '../../common/utils/logger.js';

export class AIService {
    private provider = AIProviderFactory.create(aiConfig);

    /**
     * Analyzes a text response from a patient
     */
    async analyzeTextResponse(text: string, patientId: string): Promise<AnalysisResult> {
        const context = await this.getContextForPatient(patientId);

        return this.provider.analyze({
            text,
            context
        }, SYSTEM_PROMPT_MEDICAL_ANALYSIS);
    }

    /**
     * Analyzes a photo response
     */
    async analyzePhotoResponse(photoUrl: string, caption: string = '', patientId: string): Promise<AnalysisResult> {
        // Special handle for photo prompt if we want different structure
        // For now, using the same flow but with PROMPT_PHOTO_ANALYSIS as system prompt?
        // Or we use the provider's generate directly for custom flow?

        // Let's use the standard analyze for structured output, but prepend the Photo Prompt
        const context = await this.getContextForPatient(patientId);

        return this.provider.analyze({
            text: `[PHOTO ANALYSIS REQUEST]\nCaption: ${caption}`,
            photoUrl,
            context
        }, PROMPT_PHOTO_ANALYSIS);
    }

    /**
     * Analyzes a voice response (using transcription)
     */
    async analyzeVoiceResponse(transcription: string, patientId: string): Promise<AnalysisResult> {
        return this.analyzeTextResponse(transcription, patientId);
    }

    /**
     * Retrieves context for the patient (recent history, profile)
     */
    private async getContextForPatient(patientId: string): Promise<string> {
        const prisma = await getPrisma();

        // Fetch patient basic info
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            // include: { periods: { where: { status: 'ACTIVE' } } } // Optional, or just rely on basic info
        });

        if (!patient) return '';

        // Fetch last 5 answers
        const recentAnswers = await prisma.answer.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { questionTemplate: true }
        });

        // Format history
        const history = recentAnswers.map(a =>
            `- [${a.createdAt.toISOString()}] Q: "${a.questionTemplate?.questionText || 'Unknown'}" A: "${a.textContent || a.voiceTranscription || '[Media]'}" (Risk: ${a.riskLevel})`
        ).join('\n');

        return `
Patient Name: ${patient.fullName}
Program Start: ${patient.programStartDate.toISOString()}
Current Status: ${patient.status}
Recent History:
${history}
        `.trim();
    }
}

export const aiService = new AIService();

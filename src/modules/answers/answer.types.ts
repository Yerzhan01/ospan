export enum AnswerRiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum ProcessedStatus {
    PENDING = 'PENDING',
    PROCESSED = 'PROCESSED',
    FAILED = 'FAILED'
}

// DTO for creating an answer
export interface CreateAnswerDto {
    text: string;
    mediaUrl?: string | null;
    patientId: string;
    periodId: string;
    questionTemplateId: string;
    dayNumber: number;
    timeSlot: string; // 'MORNING' | 'AFTERNOON' | 'EVENING'
    receivedAt: Date;
}

// Result of AI analysis
export interface ProcessedAnswer {
    content: string; // The text content of the answer (cleaned if needed)
    sentiment?: string;
    topics?: string[];
    riskLevel: AnswerRiskLevel;
    requiresAlert: boolean;
    summary?: string;
}

// Full Answer object extended with analysis (for frontend/service usage)
export interface AnswerWithAnalysis {
    id: string;
    text: string;
    mediaUrl?: string | null;
    patientId: string;
    periodId: string;
    questionTemplateId: string;
    dayNumber: number;
    timeSlot: string;
    receivedAt: Date;

    // Analysis fields
    processedStatus: ProcessedStatus;
    riskLevel?: AnswerRiskLevel;
    analysisResult?: any; // JSONB

    createdAt: Date;
    updatedAt: Date;
}

// Queue Job Data
export interface AnswerProcessingJob {
    answerId: string;
    text: string;
    patientId: string;
    questionText: string;
    previousContext?: string; // Optional context for AI
}

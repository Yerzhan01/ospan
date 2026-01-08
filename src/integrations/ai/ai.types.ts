export interface AIConfig {
    provider: 'openai' | 'anthropic' | 'gemini';
    apiKey: string;
    model: string;
    maxTokens?: number;
}

export interface AnalysisRequest {
    text: string;
    photoUrl?: string; // Optional URL to photo
    context?: string; // Previous context (history, medical record, etc.)
}

export interface AnalysisResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    extractedData: {
        vitaminsTaken?: boolean; // Did they take vitamins?
        mood?: string;
        complaints?: string[];
        symptoms?: string[];
        // Can be extended
    };
    summary: string;
    shouldAlert: boolean;
    alertReason?: string;
}

export interface AIProvider {
    generateResponse(prompt: string, image?: string): Promise<string>;
    analyze(request: AnalysisRequest, systemPrompt: string): Promise<AnalysisResult>;
}

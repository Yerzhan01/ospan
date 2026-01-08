import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '@/integrations/ai/ai.service';
import { aiProvider } from '@/integrations/ai/ai.provider';

const { mockProvider } = vi.hoisted(() => {
    return {
        mockProvider: {
            analyze: vi.fn(),
            generate: vi.fn()
        }
    };
});

// Mock dependencies
vi.mock('@/integrations/ai/ai.provider', () => ({
    aiProvider: mockProvider,
    AIProviderFactory: {
        create: vi.fn(() => mockProvider)
    }
}));

describe('AiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('analyzeTextResponse', () => {
        it('should return parsed analysis result', async () => {
            const mockText = 'hello';
            const mockPatientId = 'p1';
            const mockResponse = {
                summary: 'Test summary',
                topics: ['test'],
                sentiment: 'positive',
                riskLevel: 'LOW',
                actionRequired: false
            };

            // Mock provider response
            (aiProvider.analyze as any).mockResolvedValue(mockResponse);

            const result = await aiService.analyzeTextResponse(mockText, mockPatientId);

            expect(result).toEqual(mockResponse);
        });

        it('should handle errors', async () => {
            const mockText = 'hello';
            const mockPatientId = 'p1';
            (aiProvider.analyze as any).mockRejectedValue(new Error('AI Error'));

            await expect(aiService.analyzeTextResponse(mockText, mockPatientId))
                .rejects
                .toThrow('AI Error');
        });
    });
});

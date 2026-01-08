import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

import { AIConfig, AIProvider, AnalysisRequest, AnalysisResult } from './ai.types.js';
import { logger } from '../../common/utils/logger.js';

export abstract class BaseAIProvider implements AIProvider {
    constructor(protected config: AIConfig) { }

    abstract generateResponse(prompt: string, image?: string): Promise<string>;

    async analyze(request: AnalysisRequest, systemPrompt: string): Promise<AnalysisResult> {
        let fullPrompt = `${systemPrompt}\n\nUser Context:\n${request.context || 'None'}\n\nUser Message:\n${request.text}`;

        if (request.photoUrl) {
            fullPrompt += `\n\n[Photo attached: ${request.photoUrl}]`;
        }

        try {
            const responseText = await this.generateResponse(fullPrompt, request.photoUrl);
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('Invalid JSON response from AI');
            }

            const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
            return JSON.parse(jsonStr) as AnalysisResult;
        } catch (error: any) {
            logger.error({ error: error.message }, 'AI Analysis failed');
            throw error;
        }
    }
}

export class OpenAIProvider extends BaseAIProvider {
    private client: OpenAI;

    constructor(config: AIConfig) {
        super(config);
        this.client = new OpenAI({ apiKey: config.apiKey });
    }

    async generateResponse(prompt: string, image?: string): Promise<string> {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'user', content: prompt }
        ];

        if (image) {
            // OpenAI Vision handling
            messages[0] = {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: image } }
                ]
            };
        }

        const response = await this.client.chat.completions.create({
            model: this.config.model, // e.g., 'gpt-4o'
            messages,
            max_tokens: this.config.maxTokens,
        });

        return response.choices[0]?.message?.content || '';
    }
}

export class GeminiProvider extends BaseAIProvider {
    private client: GoogleGenerativeAI;

    constructor(config: AIConfig) {
        super(config);
        this.client = new GoogleGenerativeAI(config.apiKey);
    }

    async generateResponse(prompt: string, image?: string): Promise<string> {
        const model = this.client.getGenerativeModel({ model: this.config.model }); // e.g., 'gemini-1.5-flash'

        let result;
        if (image) {
            // Need to fetch image and convert to base64 or use URI if supported (Gemini usually needs base64)
            // For simplicity, assuming prompt-only for now or implementing basic text
            // TODO: Implement image fetching for Gemini
            result = await model.generateContent([prompt]);
        } else {
            result = await model.generateContent(prompt);
        }

        return result.response.text();
    }
}

export class AnthropicProvider extends BaseAIProvider {
    private client: Anthropic;

    constructor(config: AIConfig) {
        super(config);
        this.client = new Anthropic({ apiKey: config.apiKey });
    }

    async generateResponse(prompt: string, image?: string): Promise<string> {
        const message = await this.client.messages.create({
            model: this.config.model, // e.g., 'claude-3-opus-20240229'
            max_tokens: this.config.maxTokens || 1024,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = message.content[0];
        if (content.type === 'text') {
            return content.text;
        }
        return '';
    }
}

export class AIProviderFactory {
    static create(config: AIConfig): AIProvider {
        switch (config.provider) {
            case 'openai':
                return new OpenAIProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            case 'anthropic':
                return new AnthropicProvider(config);
            default:
                throw new Error(`Unsupported AI provider: ${config.provider}`);
        }
    }
}

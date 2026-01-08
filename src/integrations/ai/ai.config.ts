import { config as appConfig } from '../../config/index.js';
import { AIConfig } from './ai.types.js';

export const aiConfig: AIConfig = {
    provider: appConfig.ai.provider,
    apiKey: appConfig.ai.apiKey,
    model: appConfig.ai.model,
    // defaults
    maxTokens: 500,
};

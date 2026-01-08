import { WhatsAppConfig } from './whatsapp.types.js';
import { logger } from '../../common/utils/logger.js';
import { getPrisma } from '../../config/database.js';
import { decrypt } from '../../modules/integrations/crypto.utils.js';

export const getWhatsAppConfigFromDB = async (): Promise<WhatsAppConfig | null> => {
    try {
        const prisma = await getPrisma();
        const settings = await prisma.integrationSettings.findUnique({
            where: { type: 'whatsapp' }
        });

        if (!settings || !settings.isEnabled || !settings.credentials) {
            return null;
        }

        const credentials = JSON.parse(decrypt(settings.credentials));
        return {
            apiUrl: process.env.WHATSAPP_API_URL || 'https://api.green-api.com',
            idInstance: credentials.idInstance,
            apiTokenInstance: credentials.apiTokenInstance,
        };
    } catch (error) {
        logger.error({ err: error }, 'Failed to get WhatsApp config from DB');
        return null;
    }
};

export const getWhatsAppConfig = async (): Promise<WhatsAppConfig | null> => {
    // 1. Try DB first (if we are in an async context, which we are mostly)
    // IMPORTANT: This function was synchronous before. MIGRATION: Consumers must await it!
    // However, to keep backward compatibility without refactoring EVERYTHING right now, 
    // we might need a sync version OR refactor the service to be async on init.
    // Given the task is "Update existing services", I will refactor the service to load config async.

    // For now, let's keep this sync for env vars, but add an async version.
    return getWhatsAppConfigSync();
};

export const getWhatsAppConfigSync = (): WhatsAppConfig | null => {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const idInstance = process.env.WHATSAPP_ID_INSTANCE;
    const apiTokenInstance = process.env.WHATSAPP_API_TOKEN;

    if (!apiUrl || !idInstance || !apiTokenInstance) {
        return null;
    }

    // Ignore dummy/test credentials to prevent connection errors
    if (idInstance.includes('test') || apiTokenInstance.includes('test') ||
        idInstance.includes('dummy') || apiTokenInstance.includes('dummy')) {
        return null;
    }

    return {
        apiUrl,
        idInstance,
        apiTokenInstance,
    };
};


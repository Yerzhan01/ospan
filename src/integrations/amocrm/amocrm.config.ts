import { config } from '../../config/index.js';
import { AmoCRMConfig } from './amocrm.types.js';
import { logger } from '../../common/utils/logger.js';
import { getPrisma } from '../../config/database.js';
import { decrypt } from '../../modules/integrations/crypto.utils.js';

export const getAmoCRMConfigFromDB = async (): Promise<AmoCRMConfig | null> => {
    try {
        const prisma = await getPrisma();
        const settings = await prisma.integrationSettings.findUnique({
            where: { type: 'amocrm' }
        });

        if (!settings || !settings.isEnabled || !settings.credentials) {
            return null;
        }

        const credentials = JSON.parse(decrypt(settings.credentials));
        return {
            domain: credentials.subdomain, // stored as subdomain in DB credentials
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            redirectUri: credentials.redirectUri || process.env.AMOCRM_REDIRECT_URI || 'http://localhost:3000/api/v1/integrations/amocrm/callback',
        };
    } catch (error) {
        logger.error({ err: error }, 'Failed to get AmoCRM config from DB');
        return null;
    }
};

export const getAmoCRMConfig = async (): Promise<AmoCRMConfig | null> => {
    // Sync version by default (env vars), callers should switch to FromDB for full features
    return getAmoCRMConfigSync();
};

export const getAmoCRMConfigSync = (): AmoCRMConfig | null => {
    const domain = process.env.AMOCRM_SUBDOMAIN;
    const clientId = process.env.AMOCRM_CLIENT_ID;
    const clientSecret = process.env.AMOCRM_CLIENT_SECRET;
    const redirectUri = process.env.AMOCRM_REDIRECT_URI;

    if (!domain || !clientId || !clientSecret || !redirectUri) {
        logger.warn('AmoCRM configuration missing - integration disabled');
        return null;
    }

    return {
        domain,
        clientId,
        clientSecret,
        redirectUri,
    };
};

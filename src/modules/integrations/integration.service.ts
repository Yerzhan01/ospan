import { whatsappService } from '../../integrations/whatsapp/whatsapp.service.js';
import { amoCRMService } from '../../integrations/amocrm/amocrm.service.js';
import { amoCRMAuthService } from '../../integrations/amocrm/amocrm.auth.js';
import { getPrisma } from '../../config/database.js';
import { encrypt, decrypt } from './crypto.utils.js';
import {
    WhatsAppStatusResponse,
    AmoCRMStatusResponse,
    SaveWhatsAppCredentialsDto,
    SaveAmoCRMCredentialsDto,
    TestWhatsAppMessageDto,
    IntegrationStatus
} from './integration.types.js';
import { logger } from '../../common/utils/logger.js';
import { AmoCRMConfig } from '../../integrations/amocrm/amocrm.types.js';

class IntegrationService {

    // ===== WhatsApp =====

    async getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
        const prisma = await getPrisma();
        const settings = await prisma.integrationSettings.findUnique({
            where: { type: 'whatsapp' }
        });

        let status: IntegrationStatus['status'] = 'disconnected';
        let isConfigured = whatsappService.isConfigured;
        let isEnabled = settings?.isEnabled ?? false;
        let lastCheckedAt = settings?.lastCheckedAt ?? null;
        let lastError = settings?.lastError ?? null;
        let instanceState = 'unknown';
        let phone = '';

        if (isConfigured) {
            // Check actual status
            const state = await whatsappService.getInstanceState();
            if (state) {
                instanceState = state.stateInstance;
                if (state.stateInstance === 'authorized') {
                    status = 'connected';
                } else if (state.stateInstance === 'notAuthorized') {
                    status = 'pending_auth';
                } else {
                    status = 'error';
                }
            } else {
                status = 'error';
                lastError = 'Failed to fetch instance state';
            }
        }

        return {
            type: 'whatsapp',
            isEnabled,
            isConfigured,
            status,
            lastCheckedAt,
            lastError,
            instanceState,
            phone // API doesn't return phone easily without getSettings, assume configured
        };
    }

    async saveWhatsAppCredentials(dto: SaveWhatsAppCredentialsDto) {
        // Test credentials by simple request? Or just save.
        // We will save and init service.
        const prisma = await getPrisma();

        const credentials = JSON.stringify(dto);
        const encrypted = encrypt(credentials);

        const settings = await prisma.integrationSettings.upsert({
            where: { type: 'whatsapp' },
            create: {
                type: 'whatsapp',
                isEnabled: true,
                credentials: encrypted,
                status: 'disconnected'
            },
            update: {
                isEnabled: true,
                credentials: encrypted,
                status: 'disconnected' // Reset status until checked
            }
        });

        // Re-init service
        whatsappService.reinitialize({
            apiUrl: process.env.WHATSAPP_API_URL || 'https://api.green-api.com',
            apiTokenInstance: dto.apiTokenInstance,
            idInstance: dto.idInstance
        });

        return this.getWhatsAppStatus();
    }

    async getWhatsAppQR(): Promise<{ type: string; message: string } | null> {
        return whatsappService.getQRCode();
    }

    async testWhatsAppMessage(dto: TestWhatsAppMessageDto) {
        return whatsappService.sendMessage(dto.phone, dto.message);
    }

    async disconnectWhatsApp() {
        const prisma = await getPrisma();
        await prisma.integrationSettings.update({
            where: { type: 'whatsapp' },
            data: { isEnabled: false, status: 'disconnected', credentials: '' }
        });
        whatsappService.reinitialize(null);
        return { success: true };
    }

    // ===== AmoCRM =====

    async getAmoCRMStatus(): Promise<AmoCRMStatusResponse> {
        const prisma = await getPrisma();
        const settings = await prisma.integrationSettings.findUnique({
            where: { type: 'amocrm' }
        });

        let status: IntegrationStatus['status'] = 'disconnected';
        let isConfigured = amoCRMService.isConfigured;
        let isEnabled = settings?.isEnabled ?? false;

        // If we have tokens in credentials (from OAuth), we check checks validity
        // But actual token storage is... where? 
        // Wait, current AmoCRM auth uses Redis for tokens. 
        // IntegrationSettings stores client_id/secret (the "app" credentials).
        // The user must perform OAuth flow to get tokens.

        if (isConfigured) {
            // Check if we have valid token?
            const token = await amoCRMAuthService.getAccessToken();
            status = token ? 'connected' : 'pending_auth';
        }

        let pipelines = [];
        if (settings?.metadata) {
            try {
                pipelines = JSON.parse(settings.metadata).pipelines || [];
            } catch (e) { }
        }

        return {
            type: 'amocrm',
            isEnabled,
            isConfigured,
            status,
            lastCheckedAt: settings?.lastCheckedAt || null,
            lastError: settings?.lastError || null,
            pipelines
        };
    }

    async saveAmoCRMCredentials(dto: SaveAmoCRMCredentialsDto): Promise<{ authUrl: string }> {
        const prisma = await getPrisma();

        const credentials = JSON.stringify(dto);
        const encrypted = encrypt(credentials);

        await prisma.integrationSettings.upsert({
            where: { type: 'amocrm' },
            create: {
                type: 'amocrm',
                isEnabled: true,
                credentials: encrypted,
                status: 'pending_auth'
            },
            update: {
                isEnabled: true,
                credentials: encrypted,
                status: 'pending_auth'
            }
        });

        // Re-init service config
        const newConfig: AmoCRMConfig = {
            domain: dto.subdomain,
            clientId: dto.clientId,
            clientSecret: dto.clientSecret,
            redirectUri: dto.redirectUri || process.env.AMOCRM_REDIRECT_URI || 'http://localhost:3000/api/v1/integrations/amocrm/callback'
        };

        amoCRMAuthService.reinitialize(newConfig);
        amoCRMService.reinitialize(newConfig);

        // Generate Auth URL
        const authUrl = await amoCRMAuthService.getAuthorizationUrl(dto.clientId, newConfig.redirectUri);
        return { authUrl };
    }

    async handleAmoCRMCallback(code: string) {
        const prisma = await getPrisma();
        const settings = await prisma.integrationSettings.findUnique({ where: { type: 'amocrm' } });

        if (!settings || !settings.credentials) {
            throw new Error('AmoCRM settings not found');
        }

        const creds = JSON.parse(decrypt(settings.credentials));
        const redirectUri = creds.redirectUri || process.env.AMOCRM_REDIRECT_URI || 'http://localhost:3000/api/v1/integrations/amocrm/callback';

        // Exchange code
        const tokens = await amoCRMAuthService.handleCallback(
            code,
            creds.clientId,
            creds.clientSecret,
            redirectUri,
            creds.subdomain
        );

        // We should store tokens in Redis as before, OR in the DB?
        // `amoCRMAuthService` uses Redis. Let's stick to Redis for tokens to minimize refactor.
        // But we need to inject them into redis manually?
        // `handleCallback` returned tokens. `amoCRMAuthService` has `saveTokens` but it is private...
        // Wait, `amoCRMAuthService` should probably handle the "save to redis" part?
        // `exchangeCode` does `saveTokens`. `handleCallback` is just a helper I added.
        // I should update `handleCallback` to satisfy `exchangeCode` logic or rewrite it locally.

        // Actually, let's make `amoCRMAuthService` handle it properly.
        // But I can't access private method `saveTokens`.
        // I will use `redis` directly here or add public method.

        // BETTER: Update `amoCRMAuthService.exchangeCode` is for the OLD flow?
        // No, `exchangeCode` does exactly what we need but uses `this.amoCrmConfig`.
        // Since we reinitialized the service, `exchangeCode(code)` should work!

        const storedTokens = await amoCRMAuthService.exchangeCode(code);

        await prisma.integrationSettings.update({
            where: { type: 'amocrm' },
            data: { status: 'connected', lastCheckedAt: new Date() }
        });

        return storedTokens;
    }

    async syncAmoCRMPipelines() {
        const prisma = await getPrisma();
        const pipelines = await amoCRMService.getPipelines();

        await prisma.integrationSettings.update({
            where: { type: 'amocrm' },
            data: {
                metadata: JSON.stringify({ pipelines }),
                lastCheckedAt: new Date()
            }
        });

        return pipelines;
    }

    async disconnectAmoCRM() {
        const prisma = await getPrisma();
        await prisma.integrationSettings.update({
            where: { type: 'amocrm' },
            data: { isEnabled: false, status: 'disconnected', credentials: '' }
        });

        amoCRMAuthService.reinitialize(null);
        amoCRMService.reinitialize(null);

        return { success: true };
    }

    async getAllIntegrations(): Promise<IntegrationStatus[]> {
        const wa = await this.getWhatsAppStatus();
        const amo = await this.getAmoCRMStatus();
        return [wa, amo];
    }
}

export const integrationService = new IntegrationService();

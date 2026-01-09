import { getWhatsAppConfigSync } from './whatsapp.config.js';
import { logger } from '../../common/utils/logger.js';
import { IncomingMessage, SendMediaDto, SendMessageDto, WhatsAppConfig } from './whatsapp.types.js';

export class WhatsAppService {
    private config: WhatsAppConfig | null = null; // initialized in constructor

    constructor() {
        // Initialize synchronously if possible, or wait for first call
        // For backward compatibility, we try env vars first (sync)
        // Ideally, we should initialize async, but for now we start with what we have.
        // The service will be re-initialized by IntegrationService on startup or update.
        this.config = getWhatsAppConfigSync();
    }

    /**
     * Re-initialize the service with new configuration (e.g. from DB)
     */
    public reinitialize(newConfig: WhatsAppConfig | null) {
        this.config = newConfig;
        logger.info('WhatsAppService re-initialized');
    }

    get isConfigured(): boolean {
        return this.config !== null;
    }

    private get baseUrl() {
        if (!this.config) return '';
        return `${this.config.apiUrl}/waInstance${this.config.idInstance}`;
    }

    private get urlSuffix() {
        if (!this.config) return '';
        return `/${this.config.apiTokenInstance}`;
    }

    private formatPhoneNumber(phone: string): string {
        const cleaned = phone.replace(/[^0-9]/g, '');
        return `${cleaned}@c.us`;
    }

    async sendMessage(phone: string, message: string): Promise<{ idMessage: string } | null> {
        return this.sendTextMessage({ phone, message });
    }

    async sendTextMessage(dto: SendMessageDto): Promise<{ idMessage: string } | null> {
        if (!this.config) {
            logger.warn('WhatsApp not configured, skipping sendTextMessage');
            return null;
        }

        try {
            const chatId = this.formatPhoneNumber(dto.phone);
            const url = `${this.baseUrl}/sendMessage${this.urlSuffix}`;

            logger.info({ chatId }, 'Sending WhatsApp message...');

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    message: dto.message,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error({ error, status: response.status }, 'Failed to send WhatsApp message');
                return null;
            }

            const data = await response.json() as { idMessage: string };
            logger.info({ idMessage: data.idMessage }, 'WhatsApp message sent successfully');
            return data;

        } catch (error) {
            logger.error({ err: error }, 'Error in sendTextMessage');
            return null;
        }
    }

    async sendMedia(dto: SendMediaDto): Promise<{ idMessage: string } | null> {
        if (!this.config) {
            logger.warn('WhatsApp not configured, skipping sendMedia');
            return null;
        }

        try {
            const chatId = this.formatPhoneNumber(dto.phone);
            const url = `${this.baseUrl}/sendFileByUrl${this.urlSuffix}`;

            logger.info({ chatId, mediaUrl: dto.mediaUrl }, 'Sending WhatsApp media...');

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    urlFile: dto.mediaUrl,
                    fileName: dto.fileName || 'image.jpg',
                    caption: dto.caption || '',
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error({ error, status: response.status }, 'Failed to send WhatsApp media');
                return null;
            }

            const data = await response.json() as { idMessage: string };
            return data;

        } catch (error) {
            logger.error({ err: error }, 'Error in sendMedia');
            return null;
        }
    }

    parseIncomingMessage(body: any): IncomingMessage | null {
        try {
            if (body.typeWebhook !== 'incomingMessageReceived') {
                return null;
            }
            return body as IncomingMessage;
        } catch (error) {
            logger.error({ err: error }, 'Error parsing incoming message');
            return null;
        }
    }

    // === Management Methods ===

    async getInstanceState(): Promise<{ stateInstance: string } | null> {
        if (!this.config) return null;
        try {
            const url = `${this.baseUrl}/getStateInstance${this.urlSuffix}`;
            const response = await fetch(url);
            if (!response.ok) {
                const text = await response.text();
                logger.error({ status: response.status, text }, 'Error getting instance state (response not ok)');
                return null;
            }
            return await response.json() as { stateInstance: string };
        } catch (error) {
            logger.error({ err: error }, 'Error getting instance state');
            return null;
        }
    }

    async getQRCode(): Promise<{ type: string; message: string } | null> {
        if (!this.config) return null;
        try {
            const url = `${this.baseUrl}/qr${this.urlSuffix}`;
            const response = await fetch(url);
            if (!response.ok) {
                const text = await response.text();
                logger.error({ status: response.status, text }, 'Error getting QR code (response not ok)');
                return null;
            }
            return await response.json() as { type: string; message: string };
        } catch (error) {
            logger.error({ err: error }, 'Error getting QR code');
            return null;
        }
    }

    /**
     * Download media from URL
     */
    async downloadMedia(mediaUrl: string): Promise<Buffer | null> {
        try {
            const response = await fetch(mediaUrl);
            if (!response.ok) {
                logger.error({ status: response.status, url: mediaUrl }, 'Failed to fetch media');
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            logger.error({ err: error, url: mediaUrl }, 'Failed to download media');
            return null;
        }
    }
}


export const whatsappService = new WhatsAppService();

import axios from 'axios';
import Redis from 'ioredis';
import { getAmoCRMConfigSync } from './amocrm.config.js';
import { AmoCRMTokens, AmoCRMConfig } from './amocrm.types.js';
import { config } from '../../config/index.js';
import { logger } from '../../common/utils/logger.js';

export class AmoCRMAuthService {
    private redis: Redis | null = null;
    private amoCrmConfig: AmoCRMConfig | null = getAmoCRMConfigSync();
    private readonly REDIS_KEY = 'amocrm:tokens';

    /**
     * Re-initialize the service with new configuration
     */
    public async reinitialize(newConfig: AmoCRMConfig | null) {
        // Close existing Redis connection to prevent leak
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
        }

        this.amoCrmConfig = newConfig;
        if (this.amoCrmConfig) {
            this.redis = new Redis(config.redis.url);
        }
        logger.info('AmoCRMAuthService re-initialized');
    }

    constructor() {
        if (this.amoCrmConfig) {
            this.redis = new Redis(config.redis.url);
        }
    }

    get isConfigured(): boolean {
        return this.amoCrmConfig !== null;
    }

    /**
     * Get URL for user authorization
     */
    /**
     * Get URL for user authorization
     */
    getAuthUrl(): string | null {
        if (!this.amoCrmConfig) {
            logger.warn('AmoCRM not configured');
            return null;
        }
        const { domain, clientId, redirectUri } = this.amoCrmConfig;
        const host = domain.includes('.') ? domain : `${domain}.amocrm.ru`;
        return `https://${host}/oauth?client_id=${clientId}&state=state&mode=post_message`;
    }

    async getAuthorizationUrl(clientId: string, redirectUri: string): Promise<string> {
        const url = new URL('https://www.amocrm.ru/oauth');
        url.searchParams.append('client_id', clientId);
        url.searchParams.append('mode', 'post_message');
        url.searchParams.append('state', 'state');
        return url.toString();
    }

    async handleCallback(code: string, clientId: string, clientSecret: string, redirectUri: string, subdomain: string): Promise<AmoCRMTokens> {
        const host = subdomain.includes('.') ? subdomain : `${subdomain}.amocrm.ru`;
        const url = `https://${host}/oauth2/access_token`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error({ error, status: response.status }, 'Failed to exchange code for token');
                throw new Error('Failed to exchange code for token');
            }

            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + (data.expires_in * 1000),
            };
        } catch (error) {
            logger.error({ err: error }, 'Error in handleCallback');
            throw error;
        }
    }

    /**
     * Helper to refresh token if needed (to be called by service methods)
     */
    async refreshTokenIfNeeded(refreshToken: string, clientId: string, clientSecret: string, redirectUri: string, subdomain: string): Promise<AmoCRMTokens | null> {
        const host = subdomain.includes('.') ? subdomain : `${subdomain}.amocrm.ru`;
        const url = `https://${host}/oauth2/access_token`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    redirect_uri: redirectUri,
                }),
            });

            if (!response.ok) {
                // specific check for invalid grant?
                return null;
            }

            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + (data.expires_in * 1000),
            };
        } catch (error) {
            logger.error({ err: error }, 'Error refreshing token');
            return null;
        }
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(code: string): Promise<AmoCRMTokens | null> {
        if (!this.amoCrmConfig) {
            logger.warn('AmoCRM not configured, skipping exchangeCode');
            return null;
        }
        const { domain, clientId, clientSecret, redirectUri } = this.amoCrmConfig;
        const host = domain.includes('.') ? domain : `${domain}.amocrm.ru`;

        try {
            const response = await axios.post(`https://${host}/oauth2/access_token`, {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
            });

            const tokens: AmoCRMTokens = {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresAt: Date.now() + (response.data.expires_in * 1000)
            };

            await this.saveTokens(tokens);
            return tokens;
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to exchange AmoCRM code');
            throw error;
        }
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getAccessToken(): Promise<string | null> {
        if (!this.amoCrmConfig || !this.redis) {
            return null;
        }
        const tokensString = await this.redis.get(this.REDIS_KEY);
        if (!tokensString) return null;

        let tokens: AmoCRMTokens = JSON.parse(tokensString);

        if (Date.now() >= tokens.expiresAt - 60000) {
            logger.info('Refreshing AmoCRM tokens...');
            const refreshed = await this.refreshTokens(tokens.refreshToken);
            if (refreshed) tokens = refreshed;
        }

        return tokens.accessToken;
    }

    /**
     * Refresh tokens using refresh_token
     */
    private async refreshTokens(refreshToken: string): Promise<AmoCRMTokens | null> {
        if (!this.amoCrmConfig) return null;
        const { domain, clientId, clientSecret, redirectUri } = this.amoCrmConfig;
        const host = domain.includes('.') ? domain : `${domain}.amocrm.ru`;

        try {
            const response = await axios.post(`https://${host}/oauth2/access_token`, {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                redirect_uri: redirectUri,
            });

            const tokens: AmoCRMTokens = {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresAt: Date.now() + (response.data.expires_in * 1000)
            };

            await this.saveTokens(tokens);
            return tokens;
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Failed to refresh AmoCRM tokens');
            throw error;
        }
    }

    private async saveTokens(tokens: AmoCRMTokens) {
        if (this.redis) {
            await this.redis.set(this.REDIS_KEY, JSON.stringify(tokens));
        }
    }
}

export const amoCRMAuthService = new AmoCRMAuthService();

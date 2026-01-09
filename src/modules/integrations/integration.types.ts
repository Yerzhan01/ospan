export interface IntegrationStatus {
    type: 'whatsapp' | 'amocrm' | 'openai';
    isEnabled: boolean;
    isConfigured: boolean;
    status: 'connected' | 'pending_auth' | 'disconnected' | 'error';
    lastCheckedAt: Date | null;
    lastError: string | null;
}

export interface WhatsAppStatusResponse extends IntegrationStatus {
    type: 'whatsapp';
    instanceState?: string;
    phone?: string;
    qrCode?: string;
}

export interface AmoCRMStatusResponse extends IntegrationStatus {
    type: 'amocrm';
    accountName?: string;
    pipelines?: Array<{
        id: number;
        name: string;
        statuses: Array<{ id: number; name: string; color: string }>;
    }>;
    mapping?: Record<string, number>;
}

export interface SaveAmoCRMMappingDto {
    mapping: Record<string, number>;
}


export interface SaveWhatsAppCredentialsDto {
    idInstance: string;
    apiTokenInstance: string;
}

export interface SaveAmoCRMCredentialsDto {
    subdomain: string;
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
}

export interface TestWhatsAppMessageDto {
    phone: string;
    message: string;
}

export interface SaveOpenAICredentialsDto {
    apiKey: string;
    model?: string;
}

export interface OpenAIStatusResponse extends IntegrationStatus {
    type: 'openai';
    model?: string;
}

export type IntegrationStatusResponse = WhatsAppStatusResponse | AmoCRMStatusResponse | OpenAIStatusResponse;


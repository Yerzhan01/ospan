export interface IntegrationStatus {
    type: 'whatsapp' | 'amocrm';
    isEnabled: boolean;
    isConfigured: boolean;
    status: 'connected' | 'pending_auth' | 'disconnected' | 'error';
    lastCheckedAt: string | null;
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
    pipelines?: Array<{
        id: number;
        name: string;
        statuses: Array<{ id: number; name: string; color: string }>;
    }>;
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

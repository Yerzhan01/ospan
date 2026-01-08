export interface WhatsAppConfig {
    apiUrl: string;
    idInstance: string;
    apiTokenInstance: string;
}

export interface SendMessageDto {
    phone: string;
    message: string;
}

export interface SendTemplateDto {
    phone: string;
    templateName: string;
    params: string[];
}

export interface SendMediaDto {
    phone: string;
    mediaUrl: string;
    fileName?: string;
    caption?: string;
}

export interface IncomingMessage {
    typeWebhook: 'incomingMessageReceived' | 'stateInstanceChanged' | 'outgoingMessageStatus' | 'deviceInfo';
    instanceData: {
        idInstance: number;
        wid: string;
        typeInstance: 'whatsapp';
    };
    timestamp: number;
    idMessage: string;
    senderData: {
        chatId: string;
        sender: string;
        senderName: string;
    };
    messageData: {
        typeMessage: 'textMessage' | 'extendedTextMessage' | 'imageMessage' | 'videoMessage' | 'documentMessage' | 'audioMessage' | 'stickerMessage' | 'reactionMessage' | 'locationMessage' | 'contactMessage';
        textMessageData?: {
            textMessage: string;
        };
        extendedTextMessageData?: {
            text: string;
            description?: string;
            title?: string;
            previewType?: string;
            jpegThumbnail?: string;
        };
        fileMessageData?: {
            downloadUrl: string;
            caption?: string;
            fileName?: string;
            jpegThumbnail?: string;
            mimeType: string;
        };
    };
}

export interface WebhookPayload {
    receiptId?: number;
    body: IncomingMessage;
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

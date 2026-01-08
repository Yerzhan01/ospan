export interface Message {
    id: string;
    direction: 'incoming' | 'outgoing';
    messageType: 'text' | 'photo' | 'voice' | 'template';
    content: string | null;
    mediaUrl: string | null;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: string; // ISO date
}

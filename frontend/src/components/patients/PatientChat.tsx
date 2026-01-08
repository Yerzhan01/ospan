import { Message } from '@/types/message';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PatientChatProps {
    messages: Message[];
    isLoading?: boolean;
}

export function PatientChat({ messages, isLoading }: PatientChatProps) {
    if (isLoading) {
        return <div className="text-center py-8 text-muted-foreground">Загрузка истории...</div>;
    }

    if (!messages || messages.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">История сообщений пуста.</div>;
    }

    return (
        <div className="flex flex-col space-y-4 max-h-[600px] overflow-y-auto p-4 border rounded-md bg-slate-50">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={cn(
                        "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                        msg.direction === 'outgoing'
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                    )}
                >
                    <div className="flex flex-col gap-1">
                        {msg.content && <p>{msg.content}</p>}
                        {msg.mediaUrl && (
                            msg.messageType === 'photo' ? (
                                <img src={msg.mediaUrl} alt="Attachment" className="rounded-md max-w-full h-auto mt-2" />
                            ) : msg.messageType === 'voice' ? (
                                <audio controls src={msg.mediaUrl} className="mt-2 text-black" />
                            ) : (
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline mt-1">Вложение</a>
                            )
                        )}

                    </div>
                    <span className={cn("text-[10px] self-end opacity-70", msg.direction === 'outgoing' ? "text-white" : "text-black")}>
                        {format(new Date(msg.createdAt), 'HH:mm dd.MM', { locale: ru })}
                        {msg.direction === 'outgoing' && ` • ${msg.status}`}
                    </span>
                </div>
            ))}
        </div>
    );
}

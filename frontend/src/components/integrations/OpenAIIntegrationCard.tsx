import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Loader2, CheckCircle, XCircle, Key } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { OpenAIStatusResponse } from '@/types/integration';

export function OpenAIIntegrationCard() {
    const { openai, isLoading } = useIntegrations();
    const status = openai.status as OpenAIStatusResponse | undefined;

    // Form state
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gpt-4o');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (status?.model) {
            setModel(status.model);
        }
    }, [status]);

    const handleSave = () => {
        if (!apiKey) return;
        openai.save.mutate({ apiKey, model }, {
            onSuccess: () => {
                setIsEditing(false);
                setApiKey('');
            }
        });
    };

    const handleDisconnect = () => {
        if (confirm('Вы уверены, что хотите отключить OpenAI? Это остановит работу AI ассистента.')) {
            openai.disconnect.mutate();
        }
    };

    const isConnected = status?.status === 'connected';

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-emerald-500" />
                        <div>
                            <CardTitle>OpenAI / ChatGPT</CardTitle>
                            <CardDescription>
                                Подключение ИИ для анализа ответов пациентов
                            </CardDescription>
                        </div>
                    </div>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? "bg-green-500" : ""}>
                            {isConnected ? 'Подключено' : 'Не настроено'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isConnected && !isEditing ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>API ключ установлен</span>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Текущая модель</Label>
                            <div className="text-sm font-medium">{status?.model || 'gpt-4o'}</div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                Обновить ключ
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDisconnect}
                                disabled={openai.disconnect.isPending}
                            >
                                {openai.disconnect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Отключить
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key (sk-...)</Label>
                            <div className="relative">
                                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder="sk-..."
                                    className="pl-9"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ключ будет сохранен в зашифрованном виде.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">Модель</Label>
                            <Input
                                id="model"
                                placeholder="gpt-4o"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleSave}
                                disabled={!apiKey || openai.save.isPending}
                            >
                                {openai.save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                            {isEditing && (
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                    Отмена
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

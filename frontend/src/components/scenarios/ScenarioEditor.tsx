import { useState, useEffect } from 'react';
import { useCreateQuestion, useUpdateQuestion } from '@/hooks/useQuestions';
import { QuestionTemplate, CreateQuestionTemplateDto, TimeSlot, ResponseType } from '@/types/questionTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface ScenarioEditorProps {
    periodId: string;
    question?: QuestionTemplate | null;
    open: boolean;
    onClose: () => void;
}

export function ScenarioEditor({ periodId, question, open, onClose }: ScenarioEditorProps) {
    const createMutation = useCreateQuestion();
    const updateMutation = useUpdateQuestion();

    const [dayNumber, setDayNumber] = useState(1);
    const [timeSlot, setTimeSlot] = useState<TimeSlot>('MORNING');
    const [questionText, setQuestionText] = useState('');
    const [responseType, setResponseType] = useState<ResponseType>('TEXT');
    const [isRequired, setIsRequired] = useState(true);
    const [aiPrompt, setAiPrompt] = useState('');

    useEffect(() => {
        if (question) {
            setDayNumber(question.dayNumber);
            setTimeSlot(question.timeSlot);
            setQuestionText(question.questionText);
            setResponseType(question.responseType);
            setIsRequired(question.isRequired);
            setAiPrompt(question.aiPrompt || '');
        } else {
            // Reset for new
            setDayNumber(1);
            setTimeSlot('MORNING');
            setQuestionText('');
            setResponseType('TEXT');
            setIsRequired(true);
            setAiPrompt('');
        }
    }, [question, open]);

    const handleSave = async () => {
        const data: CreateQuestionTemplateDto = {
            periodId,
            dayNumber,
            timeSlot,
            questionText,
            responseType,
            isRequired,
            aiPrompt: aiPrompt || undefined,
            order: 0 // Backend handles or we add order field later
        };

        if (question) {
            await updateMutation.mutateAsync({ id: question.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{question ? 'Редактировать вопрос' : 'Новый вопрос'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>День</Label>
                            <Input
                                type="number"
                                min={1}
                                max={42}
                                value={dayNumber}
                                onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Время</Label>
                            <Select value={timeSlot} onValueChange={(v) => setTimeSlot(v as TimeSlot)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MORNING">Утро</SelectItem>
                                    <SelectItem value="NOON">День</SelectItem>
                                    <SelectItem value="EVENING">Вечер</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Текст вопроса</Label>
                        <Textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Как ваше самочувствие?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Тип ответа</Label>
                            <Select value={responseType} onValueChange={(v) => setResponseType(v as ResponseType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEXT">Текст</SelectItem>
                                    <SelectItem value="PHOTO">Фото</SelectItem>
                                    <SelectItem value="VOICE">Голос</SelectItem>
                                    <SelectItem value="OPTION">Выбор (кнопки)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Switch id="req" checked={isRequired} onCheckedChange={setIsRequired} />
                            <Label htmlFor="req">Обязательный</Label>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>AI Промпт (для анализатора)</Label>
                        <Textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Инструкция для ИИ, как анализировать ответ..."
                            className="h-20"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отмена</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

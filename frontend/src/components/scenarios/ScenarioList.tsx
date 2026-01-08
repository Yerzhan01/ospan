import { useQuestions, useDeleteQuestion } from '@/hooks/useQuestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Edit2, Plus } from 'lucide-react';
import { TimeSlot, QuestionTemplate } from '@/types/questionTemplate';
import { format } from 'date-fns';

interface ScenarioListProps {
    periodId: string;
    onEdit: (question: QuestionTemplate) => void;
}

export function ScenarioList({ periodId, onEdit }: ScenarioListProps) {
    const { data: questions, isLoading } = useQuestions(periodId);
    const deleteMutation = useDeleteQuestion();

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!questions || questions.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">Нет вопросов в этом периоде.</div>;
    }

    // Group by Day
    const byDay: Record<number, QuestionTemplate[]> = {};
    questions.forEach(q => {
        if (!byDay[q.dayNumber]) byDay[q.dayNumber] = [];
        byDay[q.dayNumber].push(q);
    });

    return (
        <div className="space-y-6">
            {Object.entries(byDay).sort((a, b) => Number(a[0]) - Number(b[0])).map(([day, dayQuestions]) => (
                <Card key={day}>
                    <CardHeader className="py-4 bg-muted/50">
                        <CardTitle className="text-lg">День {day}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {/* Group by TimeSlot */}
                        {(['MORNING', 'NOON', 'EVENING'] as TimeSlot[]).map(slot => {
                            const slotQuestions = dayQuestions.filter(q => q.timeSlot === slot).sort((a, b) => a.order - b.order);
                            if (slotQuestions.length === 0) return null;

                            return (
                                <div key={slot} className="border-b last:border-0 pb-4 last:pb-0">
                                    <h5 className="font-semibold text-sm mb-2 text-muted-foreground">
                                        {slot === 'MORNING' ? 'Утро' : slot === 'NOON' ? 'День' : 'Вечер'}
                                    </h5>
                                    <div className="space-y-2">
                                        {slotQuestions.map(q => (
                                            <div key={q.id} className="flex items-center justify-between bg-white p-3 rounded-md border shadow-sm">
                                                <div className="flex-1">
                                                    <p className="font-medium">{q.questionText}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline">{q.responseType}</Badge>
                                                        {q.isRequired && <Badge variant="secondary">Обязательный</Badge>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => onEdit(q)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            if (confirm('Удалить этот вопрос?')) {
                                                                deleteMutation.mutate(q.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { usePeriods } from '@/hooks/usePeriods';
import { ScenarioList } from '@/components/scenarios/ScenarioList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { QuestionTemplate } from '@/types/questionTemplate';
import { ScenarioEditor } from '@/components/scenarios/ScenarioEditor';

export default function ScenariosPage() {
    const { data: periods, isLoading: isPeriodsLoading } = usePeriods();
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionTemplate | null>(null);

    const handleEdit = (question: QuestionTemplate) => {
        setEditingQuestion(question);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingQuestion(null);
        setIsEditorOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Сценарии и Вопросы</h1>
                    <p className="text-muted-foreground">Управление шаблонами вопросов для периодов.</p>
                </div>
                {selectedPeriodId && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить вопрос
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Выберите Период</CardTitle>
                    <CardDescription>Выберите период, для которого хотите настроить вопросы.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedPeriodId} value={selectedPeriodId || ''}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Выберите период..." />
                        </SelectTrigger>
                        <SelectContent>
                            {periods?.map((period) => (
                                <SelectItem key={period.id} value={period.id}>
                                    {period.name} — {period.patient?.fullName || 'Без пациента'} ({period.status})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedPeriodId ? (
                <ScenarioList periodId={selectedPeriodId} onEdit={handleEdit} />
            ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50 border-dashed">
                    Выберите период, чтобы увидеть вопросы.
                </div>
            )}

            {selectedPeriodId && (
                <ScenarioEditor
                    open={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    periodId={selectedPeriodId}
                    question={editingQuestion}
                />
            )}
        </div>
    );
}

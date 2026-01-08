'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyTasks } from '@/hooks/useTasks';
import { CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function TasksWidget() {
    // Only show incomplete tasks
    const { data: tasks, isLoading } = useMyTasks();

    // Filter locally or via API if supported
    const pendingTasks = (tasks || []).filter(t => t.status !== 'COMPLETED').slice(0, 5);

    return (
        <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">
                    Мои задачи
                </CardTitle>
                <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="gap-1">
                        Все задачи <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)
                ) : pendingTasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        Нет задач
                    </div>
                ) : (
                    pendingTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 border-b last:border-0 pb-2 last:pb-0">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className={cn("text-sm font-medium", task.priority > 7 && "text-red-600")}>
                                    {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {isToday(new Date(task.dueDate))
                                            ? 'Сегодня'
                                            : format(new Date(task.dueDate), 'd MMM', { locale: ru })
                                        }
                                    </span>
                                    {task.patient && <span>• {task.patient.fullName}</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

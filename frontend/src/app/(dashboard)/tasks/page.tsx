'use client';

import { useMyTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/types/task';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, isPast, isFuture, isSameDay } from 'date-fns';

export default function TasksPage() {
    const { data: tasks, isLoading } = useMyTasks();

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            </div>
        );
    }

    const today = new Date();

    const overdueTasks = (tasks || []).filter(t =>
        isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'COMPLETED'
    );

    const todayTasks = (tasks || []).filter(t =>
        isToday(new Date(t.dueDate))
    );

    const futureTasks = (tasks || []).filter(t =>
        isFuture(new Date(t.dueDate)) && !isSameDay(new Date(t.dueDate), today)
    );

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Мои задачи</h1>
                <p className="text-muted-foreground">Список дел на сегодня и ближайшее время.</p>
            </div>

            {overdueTasks.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                        ⚠️ Просроченные ({overdueTasks.length})
                    </h2>
                    <div className="space-y-3">
                        {overdueTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                    Сегодня ({todayTasks.length})
                </h2>
                {todayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">На сегодня задач нет.</p>
                ) : (
                    <div className="space-y-3">
                        {todayTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                )}
            </section>

            {futureTasks.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-muted-foreground">
                        Предстоящие
                    </h2>
                    <div className="space-y-3 opacity-80">
                        {futureTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

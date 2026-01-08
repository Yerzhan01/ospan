'use client';

import { Task, TaskStatus } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Calendar,
    Phone,
    MessageSquare,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { format, isToday, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TaskCardProps {
    task: Task;
}

const typeIcons: Record<string, React.ReactNode> = {
    'CALL': <Phone className="h-4 w-4" />,
    'MESSAGE': <MessageSquare className="h-4 w-4" />,
    'FOLLOW_UP': <Calendar className="h-4 w-4" />,
    'OTHER': <AlertCircle className="h-4 w-4" />,
};

export function TaskCard({ task }: TaskCardProps) {
    const updateStatus = useUpdateTaskStatus();

    const isOverdue = isPast(new Date(task.dueDate)) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

    const handleCheck = (checked: boolean) => {
        updateStatus.mutate({
            id: task.id,
            data: { status: checked ? 'COMPLETED' : 'PENDING' }
        });
    };

    return (
        <Card className={cn(
            "transition-colors",
            task.priority > 7 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent',
            isOverdue && 'bg-red-50/50'
        )}>
            <CardContent className="p-4 flex items-start gap-4">
                <Checkbox
                    checked={task.status === 'COMPLETED'}
                    onCheckedChange={handleCheck}
                    className="mt-1"
                />

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="text-muted-foreground">
                                {typeIcons[task.type] || typeIcons['OTHER']}
                            </div>
                            <span className={cn(
                                "font-medium",
                                task.status === 'COMPLETED' && "line-through text-muted-foreground"
                            )}>
                                {task.title}
                            </span>
                        </div>
                        {task.priority > 5 && (
                            <Badge variant="outline" className="text-xs">
                                Приоритет: {task.priority}
                            </Badge>
                        )}
                    </div>

                    {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                            <span className={cn("font-medium", isOverdue && "text-red-600")}>
                                {format(new Date(task.dueDate), 'p', { locale: ru })}
                            </span>
                        </span>
                        {task.patient?.fullName && (
                            <span>
                                Пациент: {task.patient.fullName}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

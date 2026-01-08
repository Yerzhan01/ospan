'use client';

import { PatientCalendarDay } from '@/types/patient';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { CheckCircle2, XCircle, Circle, Clock } from 'lucide-react';

interface PatientCalendarProps {
    days: PatientCalendarDay[];
    isLoading: boolean;
}

export function PatientCalendar({ days, isLoading }: PatientCalendarProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-7 gap-2">
                {[...Array(42)].map((_, i) => (
                    <div key={i} className="h-24 rounded-md border bg-muted/20 animate-pulse" />
                ))}
            </div>
        );
    }

    // Ensure we display 42 days (6 weeks) even if data is partial
    // (Assuming backend returns exactly 42 days for the period, or we pad it)
    // If backend returns sparse data, we might need logic here. 
    // Assuming backend returns dense array for now based on previous context.

    return (
        <div className="grid grid-cols-7 gap-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                </div>
            ))}

            {days.map((day) => {
                const isToday = new Date().toISOString().split('T')[0] === day.date;

                let bgColor = 'bg-card';
                if (day.status === 'completed') bgColor = 'bg-green-50 border-green-200';
                if (day.status === 'missed') bgColor = 'bg-red-50 border-red-200';
                if (day.status === 'future') bgColor = 'bg-muted/10';

                return (
                    <HoverCard key={day.date}>
                        <HoverCardTrigger asChild>
                            <div
                                className={cn(
                                    "relative h-24 rounded-md border p-2 text-sm transition-colors cursor-pointer hover:border-primary/50",
                                    bgColor,
                                    isToday && "ring-2 ring-primary"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn("font-medium", isToday && "text-primary")}>
                                        День {day.dayNumber}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(day.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>

                                <div className="mt-2 flex gap-1 flex-wrap">
                                    {day.tasks.map((task) => {
                                        if (task.status === 'completed') return <CheckCircle2 key={task.id} className="h-4 w-4 text-green-600" />;
                                        if (task.status === 'missed') return <XCircle key={task.id} className="h-4 w-4 text-red-600" />;
                                        return <Circle key={task.id} className="h-4 w-4 text-muted-foreground" />;
                                    })}
                                </div>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">День {day.dayNumber} - {new Date(day.date).toLocaleDateString()}</h4>
                                <div className="space-y-1">
                                    {day.tasks.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Нет задач на этот день</p>
                                    ) : (
                                        day.tasks.map((task, idx) => (
                                            <div key={task.id} className="flex items-center gap-2 text-sm">
                                                {task.status === 'completed' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                ) : task.status === 'missed' ? (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                ) : (
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span>Задача #{idx + 1} ({task.type})</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                );
            })}
        </div>
    );
}

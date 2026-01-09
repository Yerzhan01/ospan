'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Patient } from '@/types/patient';
import { Edit, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useDeletePatient } from '@/hooks/usePatients';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PatientListProps {
    patients: Patient[];
    isLoading: boolean;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ACTIVE: { label: 'Активен', variant: 'default' },
    COMPLETED: { label: 'Завершен', variant: 'secondary' },
    PAUSED: { label: 'На паузе', variant: 'outline' },
    DROPPED: { label: 'Выбыл', variant: 'destructive' },
};

export function PatientList({ patients, isLoading }: PatientListProps) {
    const deleteMutation = useDeletePatient();

    const handleDelete = async (id: string) => {
        deleteMutation.mutate(id);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (patients.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                Пациенты не найдены
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ФИО</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Клиника</TableHead>
                        <TableHead>Трекер</TableHead>
                        <TableHead>День</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Старт программы</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patients.map((patient) => {
                        // Calculate day of program
                        const startDate = new Date(patient.programStartDate);
                        const today = new Date();
                        const dayNumber = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                        return (
                            <TableRow key={patient.id}>
                                <TableCell className="font-medium">{patient.fullName}</TableCell>
                                <TableCell>{patient.phone}</TableCell>
                                <TableCell>{patient.clinic?.name || '-'}</TableCell>
                                <TableCell>{patient.tracker?.fullName || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono">
                                        День {dayNumber}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusMap[patient.status]?.variant || 'outline'}>
                                        {statusMap[patient.status]?.label || patient.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(patient.programStartDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/patients/${patient.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Удалить пациента?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Это действие нельзя отменить. Пациент {patient.fullName} будет удален.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(patient.id)} className="bg-red-600">
                                                        Удалить
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

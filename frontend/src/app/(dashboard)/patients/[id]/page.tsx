'use client';

import { use, useState } from 'react';
import { usePatient, usePatientCalendar, usePatientHistory, usePatientAlerts } from '@/hooks/usePatients';
import { PatientCalendar } from '@/components/patients/PatientCalendar';
import { PatientChat } from '@/components/patients/PatientChat';
import { PatientAlerts } from '@/components/patients/PatientAlerts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageCircle, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { data: patient, isLoading: isPatientLoading } = usePatient(resolvedParams.id);
    const { data: calendar, isLoading: isCalendarLoading } = usePatientCalendar(resolvedParams.id);
    const { data: history, isLoading: isHistoryLoading } = usePatientHistory(resolvedParams.id);
    const { data: alerts, isLoading: isAlertsLoading } = usePatientAlerts(resolvedParams.id);
    const [activeTab, setActiveTab] = useState('info');

    if (isPatientLoading) {
        return <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>;
    }

    if (!patient) {
        return <div>Пациент не найден</div>;
    }

    const handleWhatsApp = () => {
        // Basic phone cleaning
        const phone = patient.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {patient.fullName}
                        <Badge variant={patient.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {patient.status}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground">{patient.phone}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleWhatsApp}>
                        <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                        WhatsApp
                    </Button>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Информация</TabsTrigger>
                    <TabsTrigger value="calendar">Календарь</TabsTrigger>
                    <TabsTrigger value="history">История</TabsTrigger>
                    <TabsTrigger value="alerts">Алерты</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Основные данные</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Клиника:</span>
                                    <span className="font-medium">{patient.clinic?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Трекер:</span>
                                    <span className="font-medium">{patient.tracker?.fullName || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Врач:</span>
                                    <span className="font-medium">{patient.doctor?.fullName || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Дата регистрации:</span>
                                    <span className="font-medium">{format(new Date(patient.createdAt), 'PPP', { locale: ru })}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Программа</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Старт программы:</span>
                                    <span className="font-medium">{format(new Date(patient.programStartDate), 'PPP', { locale: ru })}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Текущий период:</span>
                                    <span className="font-medium">{patient.currentPeriodId ? 'Активен' : 'Не назначен'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Календарь приема</CardTitle>
                            <CardDescription>Визуализация прогресса пациента за 42 дня.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PatientCalendar days={calendar || []} isLoading={isCalendarLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>История сообщений</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PatientChat messages={history || []} isLoading={isHistoryLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Алерты и Уведомления</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PatientAlerts alerts={alerts || []} isLoading={isAlertsLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

'use client';

import { use } from 'react';
import { usePatient, usePatientHistory } from '@/hooks/usePatients';
import { PatientChat } from '@/components/patients/PatientChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageCircle, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PatientMessagesPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { data: patient, isLoading: isPatientLoading } = usePatient(resolvedParams.id);
    const { data: messages, isLoading: isMessagesLoading } = usePatientHistory(resolvedParams.id);

    if (isPatientLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    if (!patient) {
        return <div>Пациент не найден</div>;
    }

    const handleWhatsApp = () => {
        const phone = patient.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
    };

    const handleExport = () => {
        if (!messages || messages.length === 0) return;

        const content = messages.map(m =>
            `[${new Date(m.createdAt).toLocaleString()}] ${m.direction === 'incoming' ? 'Пациент' : 'Система'}: ${m.content}`
        ).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `messages-${patient.fullName}-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">История сообщений</h1>
                    <p className="text-muted-foreground">{patient.fullName} • {patient.phone}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={!messages || messages.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Экспорт
                    </Button>
                    <Button variant="outline" onClick={handleWhatsApp}>
                        <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                        WhatsApp
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Все сообщения</CardTitle>
                    <CardDescription>
                        Полная история переписки с пациентом через WhatsApp.
                        {messages && messages.length > 0 && (
                            <span className="ml-2 text-primary">({messages.length} сообщений)</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[600px] overflow-y-auto">
                        <PatientChat messages={messages || []} isLoading={isMessagesLoading} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

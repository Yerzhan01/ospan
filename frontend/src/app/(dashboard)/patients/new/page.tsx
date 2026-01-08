'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useCreatePatient } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const createPatientSchema = z.object({
    fullName: z.string().min(2, 'Минимум 2 символа'),
    phone: z.string().min(10, 'Минимум 10 цифр'),
    programStartDate: z.date({
        message: 'Выберите дату начала',
    }),
    // clinicId: z.string().optional(), // Add when we have logic
});

type CreatePatientFormValues = z.infer<typeof createPatientSchema>;

export default function CreatePatientPage() {
    const router = useRouter();
    const createMutation = useCreatePatient();

    const form = useForm<CreatePatientFormValues>({
        resolver: zodResolver(createPatientSchema),
        defaultValues: {
            fullName: '',
            phone: '',
        },
    });

    async function onSubmit(data: CreatePatientFormValues) {
        createMutation.mutate(data, {
            onSuccess: () => {
                router.push('/patients');
            },
        });
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Новый пациент</h1>
                <p className="text-muted-foreground">
                    Добавьте пациента для начала программы сопровождения.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Данные пациента</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ФИО</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Иванов Иван Иванович" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Телефон</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+7 (707) 123-45-67" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Используется для WhatsApp сообщений.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="programStartDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Дата начала программы</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: ru })
                                                        ) : (
                                                            <span>Выберите дату</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            Первый день приема терапии.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-4">
                                <Button variant="outline" type="button" onClick={() => router.back()}>
                                    Отмена
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Создать
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

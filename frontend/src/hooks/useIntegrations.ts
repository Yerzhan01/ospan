import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    IntegrationStatus,
    WhatsAppStatusResponse,
    AmoCRMStatusResponse,
    SaveWhatsAppCredentialsDto,
    SaveAmoCRMCredentialsDto,
    SaveAmoCRMMappingDto,
    TestWhatsAppMessageDto,
    SaveOpenAICredentialsDto
} from '../types/integration';
import { toast } from 'sonner';

export const useIntegrations = () => {
    const queryClient = useQueryClient();

    // === ALL INTEGRATIONS ===
    const { data: integrations, isLoading } = useQuery<IntegrationStatus[]>({
        queryKey: ['integrations'],
        queryFn: async () => {
            const { data } = await api.get('/integrations');
            return data;
        },
    });

    // === WHATSAPP ===
    const { data: whatsappStatus } = useQuery<WhatsAppStatusResponse>({
        queryKey: ['integrations', 'whatsapp'],
        queryFn: async () => {
            const { data } = await api.get('/integrations/whatsapp');
            return data;
        },
    });

    const { data: whatsappQR, refetch: refetchQR, isPending: isQrPending, isFetching: isQrFetching } = useQuery<{ type: string; message: string }>({
        queryKey: ['integrations', 'whatsapp', 'qr'],
        queryFn: async () => {
            const { data } = await api.get('/integrations/whatsapp/qr');
            return data;
        },
        enabled: false, // Only fetch via manual trigger or effect
        retry: false
    });

    const saveWhatsAppMutation = useMutation({
        mutationFn: async (credentials: SaveWhatsAppCredentialsDto) => {
            const { data } = await api.post('/integrations/whatsapp', credentials);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            toast.success('WhatsApp credentials saved');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save WhatsApp credentials');
        }
    });

    const disconnectWhatsAppMutation = useMutation({
        mutationFn: async () => {
            await api.post('/integrations/whatsapp/disconnect');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            toast.success('WhatsApp disconnected');
        },
    });

    const testWhatsAppMutation = useMutation({
        mutationFn: async (dto: TestWhatsAppMessageDto) => {
            const { data } = await api.post('/integrations/whatsapp/test', dto);
            return data;
        },
        onSuccess: () => {
            toast.success('Test message sent');
        },
        onError: () => {
            toast.error('Failed to send test message');
        }
    });

    // === AMOCRM ===
    const { data: amocrmStatus } = useQuery<AmoCRMStatusResponse>({
        queryKey: ['integrations', 'amocrm'],
        queryFn: async () => {
            const { data } = await api.get('/integrations/amocrm');
            return data;
        },
    });

    const saveAmoCRMMutation = useMutation({
        mutationFn: async (credentials: SaveAmoCRMCredentialsDto) => {
            const { data } = await api.post('/integrations/amocrm', credentials);
            return data;
        },
        onSuccess: (data) => {
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to initiate AmoCRM auth');
        }
    });

    const syncAmoCRMMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/integrations/amocrm/sync');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            toast.success('Pipelines synced');
        },
        onError: () => {
            toast.error('Failed to sync pipelines');
        }
    });

    const saveAmoCRMMappingMutation = useMutation({
        mutationFn: async (mapping: Record<string, number>) => {
            const { data } = await api.post('/integrations/amocrm/mapping', { mapping });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            toast.success('Mapping saved');
        },
        onError: () => {
            toast.error('Failed to save mapping');
        }
    });

    const disconnectAmoCRMMutation = useMutation({
        mutationFn: async () => {
            await api.post('/integrations/amocrm/disconnect');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            toast.success('AmoCRM disconnected');
        },
    });

    return {
        integrations,
        isLoading,

        whatsapp: {
            status: whatsappStatus,
            save: saveWhatsAppMutation,
            disconnect: disconnectWhatsAppMutation,
            test: testWhatsAppMutation,
            qr: {
                data: whatsappQR,
                refetch: refetchQR,
                isPending: isQrPending,
                isFetching: isQrFetching
            }
        },

        amocrm: {
            status: amocrmStatus,
            save: saveAmoCRMMutation,
            disconnect: disconnectAmoCRMMutation,
            sync: syncAmoCRMMutation,
            saveMapping: saveAmoCRMMappingMutation
        },

        openai: {
            status: integrations?.find(i => i.type === 'openai'),
            save: useMutation({
                mutationFn: async (creds: SaveOpenAICredentialsDto) => {
                    const { data } = await api.put('/integrations/openai/credentials', creds);
                    return data;
                },
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['integrations'] });
                    toast.success('OpenAI API Key saved');
                },
                onError: () => toast.error('Failed to save OpenAI credentials')
            }),
            disconnect: useMutation({
                mutationFn: async () => {
                    await api.delete('/integrations/openai/disconnect');
                },
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['integrations'] });
                    toast.success('OpenAI disconnected');
                },
                onError: () => toast.error('Failed to disconnect OpenAI')
            })
        }
    }
};

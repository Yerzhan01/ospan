import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    QuestionTemplate,
    CreateQuestionTemplateDto,
    UpdateQuestionTemplateDto
} from '@/types/questionTemplate';
import { toast } from 'sonner';

export const questionKeys = {
    all: ['questions'] as const,
    list: (periodId: string) => [...questionKeys.all, 'list', periodId] as const,
};

const fetchQuestions = async (periodId: string): Promise<QuestionTemplate[]> => {
    // Assuming endpoint: GET /periods/:periodId/questions
    const { data } = await api.get(`/periods/${periodId}/questions`);
    return data.data;
};

const createQuestion = async (data: CreateQuestionTemplateDto): Promise<QuestionTemplate> => {
    const { data: response } = await api.post(`/question-templates`, data);
    return response.data;
};

const updateQuestion = async ({ id, data }: { id: string; data: UpdateQuestionTemplateDto }): Promise<QuestionTemplate> => {
    const { data: response } = await api.put(`/question-templates/${id}`, data);
    return response.data;
};

const deleteQuestion = async (id: string): Promise<void> => {
    await api.delete(`/question-templates/${id}`);
};

// Hooks

export function useQuestions(periodId: string) {
    return useQuery({
        queryKey: questionKeys.list(periodId),
        queryFn: () => fetchQuestions(periodId),
        enabled: !!periodId,
    });
}

export function useCreateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuestion,
        onSuccess: (data) => {
            toast.success('Вопрос добавлен');
            queryClient.invalidateQueries({ queryKey: questionKeys.list(data.periodId) });
        },
        onError: () => toast.error('Ошибка добавления вопроса'),
    });
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuestion,
        onSuccess: (data) => {
            toast.success('Вопрос обновлен');
            queryClient.invalidateQueries({ queryKey: questionKeys.list(data.periodId) });
        },
        onError: () => toast.error('Ошибка обновления вопроса'),
    });
}

export function useDeleteQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteQuestion,
        onSuccess: () => {
            toast.success('Вопрос удален');
            // Note: Optimally we need to know periodId to invalidate specific list, 
            // but for now invalidating all questions or refetching parent if possible.
            // Using loose invalidation
            queryClient.invalidateQueries({ queryKey: questionKeys.all });
        },
        onError: () => toast.error('Ошибка удаления вопроса'),
    });
}

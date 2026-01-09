/**
 * Локализация статусов и перечислений для отображения в UI
 */

// Статусы периодов
export const periodStatusLabels: Record<string, string> = {
    ACTIVE: 'Активный',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён',
    PAUSED: 'Приостановлен',
};

// Статусы пациентов
export const patientStatusLabels: Record<string, string> = {
    NEW: 'Новый',
    ACTIVE: 'Активный',
    COMPLETED: 'Завершён',
    PAUSED: 'Приостановлен',
    CANCELLED: 'Отменён',
};

// Статусы алёртов
export const alertStatusLabels: Record<string, string> = {
    NEW: 'Новый',
    IN_PROGRESS: 'В работе',
    ESCALATED: 'Эскалирован',
    RESOLVED: 'Решён',
};

// Типы алёртов
export const alertTypeLabels: Record<string, string> = {
    MISSED_RESPONSE: 'Пропущен ответ',
    BAD_CONDITION: 'Плохое самочувствие',
    CRITICAL_RESPONSE: 'Критический ответ',
    HIGH_RISK: 'Высокий риск',
    MANUAL: 'Ручной алёрт',
};

// Уровни риска
export const riskLevelLabels: Record<string, string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    CRITICAL: 'Критический',
};

// Статусы задач
export const taskStatusLabels: Record<string, string> = {
    PENDING: 'Ожидает',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Выполнена',
    CANCELLED: 'Отменена',
};

// Типы задач
export const taskTypeLabels: Record<string, string> = {
    CALL_PATIENT: 'Позвонить пациенту',
    REVIEW_ANSWER: 'Проверить ответ',
    ESCALATE: 'Эскалация',
    OTHER: 'Другое',
};

// Временные слоты
export const timeSlotLabels: Record<string, string> = {
    MORNING: 'Утро',
    AFTERNOON: 'День',
    EVENING: 'Вечер',
};

// Роли пользователей
export const userRoleLabels: Record<string, string> = {
    ADMIN: 'Администратор',
    TRACKER: 'Трекер',
    DOCTOR: 'Врач',
    OPERATOR: 'Оператор',
};

/**
 * Универсальная функция локализации
 * @param value - Значение для локализации
 * @param labels - Объект с метками
 * @param fallback - Значение по умолчанию (опционально)
 */
export function localize(
    value: string | undefined | null,
    labels: Record<string, string>,
    fallback?: string
): string {
    if (!value) return fallback || '';
    return labels[value] || fallback || value;
}

/**
 * Получение цвета для статуса (для Badge компонентов)
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const alertStatusColors: Record<string, BadgeVariant> = {
    NEW: 'destructive',
    IN_PROGRESS: 'default',
    ESCALATED: 'secondary',
    RESOLVED: 'outline',
};

export const riskLevelColors: Record<string, BadgeVariant> = {
    LOW: 'outline',
    MEDIUM: 'secondary',
    HIGH: 'default',
    CRITICAL: 'destructive',
};

export const taskStatusColors: Record<string, BadgeVariant> = {
    PENDING: 'secondary',
    IN_PROGRESS: 'default',
    COMPLETED: 'outline',
    CANCELLED: 'secondary',
};

export const patientStatusColors: Record<string, BadgeVariant> = {
    NEW: 'secondary',
    ACTIVE: 'default',
    COMPLETED: 'outline',
    PAUSED: 'secondary',
    CANCELLED: 'destructive',
};

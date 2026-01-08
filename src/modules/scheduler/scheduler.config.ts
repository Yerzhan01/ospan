import { TimeSlot } from '@prisma/client';
import { TimeSlotConfig } from './scheduler.types.js';

/**
 * Дефолтное расписание отправки сообщений
 */
export const DEFAULT_SCHEDULE: TimeSlotConfig[] = [
    {
        slot: TimeSlot.MORNING,
        hour: 9,
        minute: 0,
    },
    {
        slot: TimeSlot.AFTERNOON,
        hour: 14,
        minute: 0,
    },
    {
        slot: TimeSlot.EVENING,
        hour: 20,
        minute: 0,
    },
];

/**
 * Название очереди
 */
export const MESSAGES_QUEUE_NAME = 'messages-queue';

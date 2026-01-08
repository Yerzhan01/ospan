import { vi } from 'vitest';

// Mock Logger
vi.mock('@/common/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    }
}));

// Mock Database Config
import { prismaMock } from './prisma.mock';
vi.mock('@/config/database', () => ({
    getPrisma: vi.fn(() => prismaMock),
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn(),
}));

// Mock Events
vi.mock('@/common/events/events', () => ({
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(),
    },
    AppEvents: {
        PATIENT_CREATED: 'patient.created',
        ALERT_CREATED: 'alert.created',
    }
}));

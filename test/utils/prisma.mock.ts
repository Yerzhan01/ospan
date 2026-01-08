import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';
import { vi } from 'vitest';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Mock $transaction to support both Promise[] and callback
prismaMock.$transaction.mockImplementation((arg: any) => {
    if (Array.isArray(arg)) {
        return Promise.all(arg);
    }
    if (typeof arg === 'function') {
        return arg(prismaMock);
    }
    return Promise.resolve(arg);
});

vi.mock('@/lib/prisma', () => ({
    default: prismaMock,
    prisma: prismaMock,
    getPrisma: vi.fn(() => prismaMock),
}));

// Mock database config for getPrisma
vi.mock('@/config/database', () => ({
    getPrisma: vi.fn(() => prismaMock),
}));

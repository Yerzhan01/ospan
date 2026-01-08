import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './index.js';
import { logger } from '../common/utils/logger.js';

const { Pool } = pg;

import { PrismaClient } from '@prisma/client';

// Тип для Prisma клиента
type PrismaClientType = PrismaClient;

// Глобальная переменная для singleton в dev режиме
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClientType | undefined;
}

/**
 * Создаёт инстанс Prisma Client с PostgreSQL адаптером
 */
async function createPrismaClient(): Promise<PrismaClientType> {
    const pool = new Pool({
        connectionString: config.database.url,
    });

    const adapter = new PrismaPg(pool);

    // Динамический импорт PrismaClient (будет доступен после prisma generate)
    const prismaModule = await import('@prisma/client');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PrismaClient = (prismaModule as any).PrismaClient;

    const client = new PrismaClient({
        adapter,
        log: config.env === 'development'
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' },
            ]
            : [{ emit: 'event', level: 'error' }],
    });

    // Логирование запросов в dev режиме
    if (config.env === 'development') {
        client.$on('query', (e: { query: string; params: string; duration: number }) => {
            logger.debug({
                query: e.query,
                params: e.params,
                duration: `${e.duration}ms`,
            }, 'Prisma Query');
        });
    }

    client.$on('error', (e: unknown) => {
        logger.error({ error: e }, 'Prisma Error');
    });

    return client as unknown as PrismaClientType;
}

// Lazy initialization
let prismaInstance: PrismaClientType | null = null;

/**
 * Получает singleton инстанс Prisma Client
 */
export async function getPrisma(): Promise<PrismaClientType> {
    if (global.prisma) {
        return global.prisma;
    }

    if (!prismaInstance) {
        prismaInstance = await createPrismaClient();

        if (config.env === 'development') {
            global.prisma = prismaInstance;
        }
    }

    return prismaInstance;
}

/**
 * Подключение к базе данных
 */
export async function connectDatabase(): Promise<void> {
    try {
        const prisma = await getPrisma();
        await prisma.$connect();
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.error({ error }, '❌ Failed to connect to database');
        throw error;
    }
}

/**
 * Отключение от базы данных
 */
export async function disconnectDatabase(): Promise<void> {
    const prisma = await getPrisma();
    await prisma.$disconnect();
    logger.info('Database disconnected');
}

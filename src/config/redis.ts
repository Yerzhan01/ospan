import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../common/utils/logger.js';

/**
 * Redis клиент для очередей и кэширования
 */
export const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    lazyConnect: true,
});

// События подключения
redis.on('connect', () => {
    logger.info('🔌 Redis connecting...');
});

redis.on('ready', () => {
    logger.info('✅ Redis connected and ready');
});

redis.on('error', (error) => {
    logger.error({ error }, '❌ Redis error');
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
    logger.info('🔄 Redis reconnecting...');
});

/**
 * Подключение к Redis
 */
export async function connectRedis(): Promise<void> {
    try {
        await redis.connect();
    } catch (error) {
        logger.error({ error }, '❌ Failed to connect to Redis');
        throw error;
    }
}

/**
 * Отключение от Redis
 */
export async function disconnectRedis(): Promise<void> {
    await redis.quit();
    logger.info('Redis disconnected');
}

/**
 * Проверка подключения Redis
 */
export async function pingRedis(): Promise<boolean> {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch {
        return false;
    }
}

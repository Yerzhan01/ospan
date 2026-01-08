import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/AppError.js';
import { config } from '../../config/index.js';

// Роли пользователей (дублируем из Prisma для избежания зависимости от generated client)
export type UserRole = 'ADMIN' | 'TRACKER' | 'DOCTOR' | 'OPERATOR';

// Тип пользователя в JWT payload
export interface JwtUser {
    userId: string;
    email: string;
    role: UserRole;
}

// Расширяем @fastify/jwt для корректной типизации
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtUser;
        user: JwtUser;
    }
}

// Пути, которые не требуют авторизации
const PUBLIC_PATHS = [
    '/health',
    '/api/v1/auth/login',
    '/api/v1/auth/refresh',
    '/api/webhooks',
    '/api/v1/integrations/amocrm/callback',
];

/**
 * Проверяет, является ли путь публичным
 */
function isPublicPath(path: string): boolean {
    return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
}

/**
 * Middleware для проверки JWT авторизации
 */
export async function authMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> {
    // Пропускаем публичные пути
    if (isPublicPath(request.url)) {
        return;
    }

    try {
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw AppError.unauthorized('Токен авторизации не предоставлен');
        }

        if (!authHeader.startsWith('Bearer ')) {
            throw AppError.unauthorized('Неверный формат токена');
        }

        const token = authHeader.substring(7);

        if (!token) {
            throw AppError.unauthorized('Токен авторизации пуст');
        }

        // Верификация JWT
        const jwt = await import('jsonwebtoken');

        try {
            const payload = jwt.default.verify(token, config.jwt.secret) as JwtUser;

            // Добавляем user в request (через @fastify/jwt интерфейс)
            (request as unknown as { user: JwtUser }).user = payload;
        } catch (jwtError) {
            if (jwtError instanceof jwt.default.TokenExpiredError) {
                throw AppError.unauthorized('Токен авторизации истёк');
            }
            if (jwtError instanceof jwt.default.JsonWebTokenError) {
                throw AppError.unauthorized('Недействительный токен авторизации');
            }
            throw jwtError;
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw AppError.unauthorized('Ошибка авторизации');
    }
}

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole, JwtUser } from './auth.js';
import { AppError } from '../errors/AppError.js';

/**
 * Создаёт middleware для проверки роли пользователя
 * @param allowedRoles - Массив разрешённых ролей
 */
export function roleGuard(allowedRoles: UserRole[]) {
    return async function (
        request: FastifyRequest,
        _reply: FastifyReply
    ): Promise<void> {
        // Получаем user из request (установлен authMiddleware или @fastify/jwt)
        const user = (request as unknown as { user?: JwtUser }).user;

        // Проверяем наличие user
        if (!user) {
            throw AppError.unauthorized('Требуется авторизация');
        }

        // Проверяем роль пользователя
        if (!allowedRoles.includes(user.role)) {
            throw AppError.forbidden(
                `Недостаточно прав. Требуется одна из ролей: ${allowedRoles.join(', ')}`
            );
        }
    };
}

/**
 * Middleware только для администраторов
 */
export const adminOnly = roleGuard(['ADMIN']);

/**
 * Middleware для администраторов и трекеров
 */
export const managerOrAdmin = roleGuard(['ADMIN', 'TRACKER']);

/**
 * Middleware для врачей
 */
export const doctorAccess = roleGuard(['ADMIN', 'DOCTOR']);

/**
 * Middleware для всех авторизованных сотрудников
 */
export const staffAccess = roleGuard(['ADMIN', 'TRACKER', 'DOCTOR', 'OPERATOR']);

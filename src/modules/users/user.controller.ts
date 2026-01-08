import type { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from './user.service.js';
import { authService } from './auth.service.js';
import { successResponse, paginatedResponse } from '../../common/utils/index.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { AppError } from '../../common/errors/index.js';
import { moduleLogger } from '../../common/utils/logger.js';
import {
    createUserSchema,
    updateUserSchema,
    loginSchema,
    refreshTokenSchema,
    userListQuerySchema,
    userIdParamSchema,
} from './user.schema.js';
import type { UserFilters, UserRole } from './user.types.js';

const logger = moduleLogger('UserController');

/**
 * Контроллер для работы с пользователями и аутентификацией
 */
export class UserController {
    /**
     * POST /api/v1/auth/register
     * Регистрация нового пользователя (только ADMIN)
     */
    async register(request: FastifyRequest, reply: FastifyReply) {
        const data = createUserSchema.parse(request.body);

        logger.info({ email: data.email }, 'Register request');

        const user = await userService.create(data);

        return reply.status(201).send(successResponse(user));
    }

    /**
     * POST /api/v1/auth/login
     * Вход в систему
     */
    async login(request: FastifyRequest, reply: FastifyReply) {
        const { email, password } = loginSchema.parse(request.body);

        logger.info({ email }, 'Login request');

        const result = await authService.login(email, password);

        // Устанавливаем refresh token в httpOnly cookie
        reply.setCookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
            maxAge: 7 * 24 * 60 * 60, // 7 дней
        });

        return reply.send(successResponse(result));
    }

    /**
     * GET /api/v1/auth/me
     * Получение текущего пользователя
     */
    async me(request: FastifyRequest, reply: FastifyReply) {
        const jwtUser = (request as any).user;

        if (!jwtUser) {
            throw AppError.unauthorized('Требуется авторизация');
        }

        const user = await userService.findById(jwtUser.userId);

        if (!user) {
            throw AppError.notFound('Пользователь не найден');
        }

        return reply.send(successResponse(user));
    }

    /**
     * POST /api/v1/auth/refresh
     * Обновление токенов
     */
    async refresh(request: FastifyRequest, reply: FastifyReply) {
        // Берём refresh token из cookie или body
        let refreshToken = (request.cookies as any)?.refreshToken;

        if (!refreshToken) {
            const body = refreshTokenSchema.parse(request.body);
            refreshToken = body.refreshToken;
        }

        if (!refreshToken) {
            throw AppError.unauthorized('Refresh token не предоставлен');
        }

        const result = await authService.refreshToken(refreshToken);

        // Обновляем cookie
        reply.setCookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.send(successResponse(result));
    }

    /**
     * POST /api/v1/auth/logout
     * Выход из системы
     */
    async logout(_request: FastifyRequest, reply: FastifyReply) {
        // Очищаем cookie
        reply.clearCookie('refreshToken', {
            path: '/api/v1/auth/refresh',
        });

        return reply.send(successResponse({ message: 'Выход выполнен успешно' }));
    }

    /**
     * GET /api/v1/users
     * Список пользователей (ADMIN, TRACKER)
     */
    async getUsers(request: FastifyRequest, reply: FastifyReply) {
        const query = userListQuerySchema.parse(request.query);
        const pagination = parsePagination(query);

        const filters: UserFilters = {};

        if (query.role) {
            filters.role = query.role as UserRole;
        }
        if (query.clinicId) {
            filters.clinicId = query.clinicId;
        }
        if (query.isActive !== undefined) {
            filters.isActive = query.isActive === 'true';
        }
        if (query.search) {
            filters.search = query.search;
        }

        const { users, total } = await userService.list(filters, pagination);

        return reply.send(paginatedResponse(users, {
            page: pagination.page,
            limit: pagination.limit,
            total,
        }));
    }

    /**
     * GET /api/v1/users/:id
     * Получение пользователя по ID
     */
    async getUser(request: FastifyRequest, reply: FastifyReply) {
        const { id } = userIdParamSchema.parse(request.params);

        const user = await userService.findById(id);

        if (!user) {
            throw AppError.notFound('Пользователь не найден');
        }

        return reply.send(successResponse(user));
    }

    /**
     * PUT /api/v1/users/:id
     * Обновление пользователя
     */
    async updateUser(request: FastifyRequest, reply: FastifyReply) {
        const { id } = userIdParamSchema.parse(request.params);
        const data = updateUserSchema.parse(request.body);

        const user = await userService.update(id, data);

        return reply.send(successResponse(user));
    }

    /**
     * DELETE /api/v1/users/:id
     * Удаление пользователя (ADMIN)
     */
    async deleteUser(request: FastifyRequest, reply: FastifyReply) {
        const { id } = userIdParamSchema.parse(request.params);

        await userService.delete(id);

        return reply.send(successResponse({ message: 'Пользователь удалён' }));
    }
}

// Singleton instance
export const userController = new UserController();

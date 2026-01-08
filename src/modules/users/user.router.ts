import type { FastifyInstance } from 'fastify';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { roleGuard, adminOnly, managerOrAdmin } from '../../common/middleware/roleGuard.js';

/**
 * Роутер модуля пользователей
 */
export async function userRouter(app: FastifyInstance) {
    // ============================================
    // ПУБЛИЧНЫЕ РОУТЫ (без авторизации)
    // ============================================

    // POST /api/v1/auth/login - вход
    app.post('/auth/login', async (request, reply) => {
        return userController.login(request, reply);
    });

    // POST /api/v1/auth/refresh - обновление токенов
    app.post('/auth/refresh', async (request, reply) => {
        return userController.refresh(request, reply);
    });

    // ============================================
    // ЗАЩИЩЁННЫЕ РОУТЫ (требуют авторизации)
    // ============================================

    // Регистрируем защищённые роуты
    app.register(async (protectedApp) => {
        // Применяем auth middleware ко всем роутам в этом контексте
        protectedApp.addHook('preHandler', authMiddleware);

        // ----------------------------------------
        // Auth роуты
        // ----------------------------------------

        // GET /api/v1/auth/me - текущий пользователь
        protectedApp.get('/auth/me', async (request, reply) => {
            return userController.me(request, reply);
        });

        // POST /api/v1/auth/logout - выход
        protectedApp.post('/auth/logout', async (request, reply) => {
            return userController.logout(request, reply);
        });

        // POST /api/v1/auth/register - регистрация (только ADMIN)
        protectedApp.post('/auth/register', {
            preHandler: adminOnly,
        }, async (request, reply) => {
            return userController.register(request, reply);
        });

        // ----------------------------------------
        // User CRUD роуты
        // ----------------------------------------

        // GET /api/v1/users - список пользователей (ADMIN, TRACKER)
        protectedApp.get('/users', {
            preHandler: managerOrAdmin,
        }, async (request, reply) => {
            return userController.getUsers(request, reply);
        });

        // GET /api/v1/users/:id - получение пользователя (ADMIN, TRACKER)
        protectedApp.get('/users/:id', {
            preHandler: managerOrAdmin,
        }, async (request, reply) => {
            return userController.getUser(request, reply);
        });

        // PUT /api/v1/users/:id - обновление пользователя (ADMIN, TRACKER)
        protectedApp.put('/users/:id', {
            preHandler: managerOrAdmin,
        }, async (request, reply) => {
            return userController.updateUser(request, reply);
        });

        // DELETE /api/v1/users/:id - удаление пользователя (только ADMIN)
        protectedApp.delete('/users/:id', {
            preHandler: adminOnly,
        }, async (request, reply) => {
            return userController.deleteUser(request, reply);
        });
    });
}

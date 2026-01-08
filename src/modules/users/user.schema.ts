import { z } from 'zod';

/**
 * Zod схемы для валидации
 */

// Роли пользователей
export const userRoleSchema = z.enum(['ADMIN', 'TRACKER', 'DOCTOR', 'OPERATOR']);

// Схема для создания пользователя
export const createUserSchema = z.object({
    email: z
        .string()
        .email('Некорректный email')
        .min(1, 'Email обязателен'),
    password: z
        .string()
        .min(8, 'Пароль должен быть минимум 8 символов')
        .max(100, 'Пароль слишком длинный'),
    fullName: z
        .string()
        .min(2, 'Имя должно быть минимум 2 символа')
        .max(100, 'Имя слишком длинное'),
    role: userRoleSchema,
    phone: z
        .string()
        .regex(/^\+?[0-9]{10,15}$/, 'Некорректный номер телефона')
        .optional(),
    clinicId: z.string().cuid().optional(),
});

// Схема для обновления пользователя
export const updateUserSchema = z.object({
    email: z
        .string()
        .email('Некорректный email')
        .optional(),
    password: z
        .string()
        .min(8, 'Пароль должен быть минимум 8 символов')
        .max(100, 'Пароль слишком длинный')
        .optional(),
    fullName: z
        .string()
        .min(2, 'Имя должно быть минимум 2 символа')
        .max(100, 'Имя слишком длинное')
        .optional(),
    role: userRoleSchema.optional(),
    phone: z
        .string()
        .regex(/^\+?[0-9]{10,15}$/, 'Некорректный номер телефона')
        .nullable()
        .optional(),
    clinicId: z.string().cuid().nullable().optional(),
    isActive: z.boolean().optional(),
});

// Схема для логина
export const loginSchema = z.object({
    email: z
        .string()
        .email('Некорректный email')
        .min(1, 'Email обязателен'),
    password: z
        .string()
        .min(1, 'Пароль обязателен'),
});

// Схема для refresh token
export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .min(1, 'Refresh token обязателен'),
});

// Схема query параметров для списка
export const userListQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    role: userRoleSchema.optional(),
    clinicId: z.string().cuid().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
});

// Схема для ID параметра
export const userIdParamSchema = z.object({
    id: z.string().cuid('Некорректный ID пользователя'),
});

// Типы из схем
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

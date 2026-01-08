/**
 * Типы для модуля пользователей
 */

// Роли пользователей (соответствует Prisma enum)
export type UserRole = 'ADMIN' | 'TRACKER' | 'DOCTOR' | 'OPERATOR';

// DTO для создания пользователя
export interface CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    phone?: string;
    clinicId?: string;
}

// DTO для обновления пользователя
export interface UpdateUserDto {
    email?: string;
    password?: string;
    fullName?: string;
    role?: UserRole;
    phone?: string | null;
    clinicId?: string | null;
    isActive?: boolean;
}

// DTO для логина
export interface LoginDto {
    email: string;
    password: string;
}

// Ответ с данными пользователя (без пароля)
export interface UserResponse {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    phone: string | null;
    clinicId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// JWT Payload
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}

// Токены
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// Ответ на логин
export interface LoginResponse {
    user: UserResponse;
    tokens: TokenPair;
}

// Ответ на refresh
export interface RefreshResponse {
    tokens: TokenPair;
}

// Фильтры для списка пользователей
export interface UserFilters {
    role?: UserRole;
    clinicId?: string;
    isActive?: boolean;
    search?: string;
}

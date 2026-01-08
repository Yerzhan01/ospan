import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { AppError } from '../../common/errors/index.js';
import { moduleLogger } from '../../common/utils/logger.js';
import { userService } from './user.service.js';
import type {
    JwtPayload,
    TokenPair,
    LoginResponse,
    RefreshResponse,
    UserResponse
} from './user.types.js';

const logger = moduleLogger('AuthService');

// Время жизни токенов
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';
const ACCESS_TOKEN_EXPIRES_SECONDS = 15 * 60; // 15 минут

/**
 * Сервис аутентификации
 */
export class AuthService {
    /**
     * Логин пользователя
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        logger.info({ email }, 'Login attempt');

        // Находим пользователя
        const user = await userService.findByEmail(email);

        if (!user) {
            logger.warn({ email }, 'Login failed: user not found');
            throw AppError.unauthorized('Неверный email или пароль');
        }

        // Проверяем активность
        if (!user.isActive) {
            logger.warn({ email }, 'Login failed: user is inactive');
            throw AppError.forbidden('Аккаунт деактивирован');
        }

        // Проверяем пароль
        const isPasswordValid = await userService.validatePassword(
            user.passwordHash,
            password
        );

        if (!isPasswordValid) {
            logger.warn({ email }, 'Login failed: invalid password');
            throw AppError.unauthorized('Неверный email или пароль');
        }

        // Генерируем токены
        const tokens = this.generateTokens(user);

        logger.info({ userId: user.id }, 'Login successful');

        // Убираем passwordHash из ответа
        const { passwordHash: _, ...userResponse } = user;

        return {
            user: userResponse,
            tokens,
        };
    }

    /**
     * Генерация пары токенов
     */
    generateTokens(user: UserResponse): TokenPair {
        const accessPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'access',
        };

        const refreshPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'refresh',
        };

        const accessToken = jwt.sign(accessPayload, config.jwt.secret, {
            expiresIn: ACCESS_TOKEN_EXPIRES,
        });

        const refreshToken = jwt.sign(refreshPayload, config.jwt.secret, {
            expiresIn: REFRESH_TOKEN_EXPIRES,
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRES_SECONDS,
        };
    }

    /**
     * Обновление токенов по refresh token
     */
    async refreshToken(refreshToken: string): Promise<RefreshResponse> {
        logger.debug('Refreshing tokens');

        // Валидируем refresh token
        const payload = this.validateToken(refreshToken);

        if (payload.type !== 'refresh') {
            throw AppError.unauthorized('Недействительный refresh token');
        }

        // Проверяем что пользователь существует и активен
        const user = await userService.findById(payload.userId);

        if (!user) {
            throw AppError.unauthorized('Пользователь не найден');
        }

        if (!user.isActive) {
            throw AppError.forbidden('Аккаунт деактивирован');
        }

        // Генерируем новые токены
        const tokens = this.generateTokens(user);

        logger.info({ userId: user.id }, 'Tokens refreshed successfully');

        return { tokens };
    }

    /**
     * Валидация токена
     */
    validateToken(token: string): JwtPayload {
        try {
            const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
            return payload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw AppError.unauthorized('Токен истёк');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw AppError.unauthorized('Недействительный токен');
            }
            throw error;
        }
    }

    /**
     * Декодирование токена без валидации (для отладки)
     */
    decodeToken(token: string): JwtPayload | null {
        try {
            return jwt.decode(token) as JwtPayload | null;
        } catch {
            return null;
        }
    }
}

// Singleton instance
export const authService = new AuthService();

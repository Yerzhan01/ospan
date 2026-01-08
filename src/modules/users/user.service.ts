import bcrypt from 'bcrypt';
import { getPrisma } from '../../config/database.js';
import { AppError } from '../../common/errors/index.js';
import { moduleLogger } from '../../common/utils/logger.js';
import type { CreateUserDto, UpdateUserDto, UserResponse, UserFilters } from './user.types.js';
import type { PaginationResult } from '../../common/utils/pagination.js';

const logger = moduleLogger('UserService');
const SALT_ROUNDS = 12;

/**
 * Сервис для работы с пользователями
 */
export class UserService {
    /**
     * Создание нового пользователя
     */
    async create(data: CreateUserDto): Promise<UserResponse> {
        logger.info({ email: data.email, role: data.role }, 'Creating new user');

        const prisma = await getPrisma();

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await this.findByEmail(data.email);
        if (existingUser) {
            throw AppError.conflict('Пользователь с таким email уже существует');
        }

        // Хешируем пароль
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Создаём пользователя
        const user = await (prisma as any).user.create({
            data: {
                email: data.email,
                passwordHash,
                fullName: data.fullName,
                role: data.role,
                phone: data.phone,
                clinicId: data.clinicId,
            },
        });

        logger.info({ userId: user.id }, 'User created successfully');

        return this.toUserResponse(user);
    }

    /**
     * Поиск пользователя по ID
     */
    async findById(id: string): Promise<UserResponse | null> {
        const prisma = await getPrisma();

        const user = await (prisma as any).user.findUnique({
            where: { id, deletedAt: null },
        });

        return user ? this.toUserResponse(user) : null;
    }

    /**
     * Поиск пользователя по email (включая passwordHash для авторизации)
     */
    async findByEmail(email: string): Promise<(UserResponse & { passwordHash: string }) | null> {
        const prisma = await getPrisma();

        const user = await (prisma as any).user.findUnique({
            where: { email },
        });

        if (!user || user.deletedAt) {
            return null;
        }

        return {
            ...this.toUserResponse(user),
            passwordHash: user.passwordHash,
        };
    }

    /**
     * Обновление пользователя
     */
    async update(id: string, data: UpdateUserDto): Promise<UserResponse> {
        logger.info({ userId: id }, 'Updating user');

        const prisma = await getPrisma();

        // Проверяем существование
        const existingUser = await this.findById(id);
        if (!existingUser) {
            throw AppError.notFound('Пользователь не найден');
        }

        // Если меняется email - проверяем уникальность
        if (data.email && data.email !== existingUser.email) {
            const userWithEmail = await this.findByEmail(data.email);
            if (userWithEmail) {
                throw AppError.conflict('Пользователь с таким email уже существует');
            }
        }

        // Подготавливаем данные для обновления
        const updateData: Record<string, unknown> = { ...data };

        // Хешируем новый пароль если он передан
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
            delete updateData.password;
        }

        const user = await (prisma as any).user.update({
            where: { id },
            data: updateData,
        });

        logger.info({ userId: id }, 'User updated successfully');

        return this.toUserResponse(user);
    }

    /**
     * Мягкое удаление пользователя
     */
    async delete(id: string): Promise<void> {
        logger.info({ userId: id }, 'Deleting user');

        const prisma = await getPrisma();

        const existingUser = await this.findById(id);
        if (!existingUser) {
            throw AppError.notFound('Пользователь не найден');
        }

        await (prisma as any).user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });

        logger.info({ userId: id }, 'User deleted successfully');
    }

    /**
     * Проверка пароля
     */
    async validatePassword(passwordHash: string, password: string): Promise<boolean> {
        return bcrypt.compare(password, passwordHash);
    }

    /**
     * Список пользователей с фильтрами и пагинацией
     */
    async list(
        filters: UserFilters,
        pagination: PaginationResult
    ): Promise<{ users: UserResponse[]; total: number }> {
        const prisma = await getPrisma();

        // Формируем where условие
        const where: Record<string, unknown> = {
            deletedAt: null,
        };

        if (filters.role) {
            where.role = filters.role;
        }

        if (filters.clinicId) {
            where.clinicId = filters.clinicId;
        }

        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters.search) {
            where.OR = [
                { fullName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Получаем данные
        const [users, total] = await Promise.all([
            (prisma as any).user.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            (prisma as any).user.count({ where }),
        ]);

        return {
            users: users.map((user: any) => this.toUserResponse(user)),
            total,
        };
    }

    /**
     * Преобразование модели в UserResponse (без пароля)
     */
    private toUserResponse(user: any): UserResponse {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
            clinicId: user.clinicId,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}

// Singleton instance
export const userService = new UserService();

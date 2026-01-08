import { Clinic, Prisma, PatientStatus } from '@prisma/client';
import { getPrisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/utils/logger.js';
import {
    CreateClinicDto,
    UpdateClinicDto,
    ClinicFilters,
    ClinicListItem,
    ClinicWithStats
} from './clinic.types.js';

export class ClinicService {
    /**
     * Создание клиники
     */
    async create(data: CreateClinicDto, createdByUserId?: string): Promise<Clinic> {
        const prisma = await getPrisma();

        return await prisma.$transaction(async (tx) => {
            const clinic = await tx.clinic.create({
                data: {
                    name: data.name,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
                },
            });

            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entityType: 'CLINIC',
                    entityId: clinic.id,
                    userId: createdByUserId,
                    changes: clinic as unknown as Prisma.InputJsonValue,
                },
            });

            logger.info({ clinicId: clinic.id }, 'Clinic created successfully');
            return clinic;
        });
    }

    /**
     * Получение клиники по ID с подсчётом статистики
     */
    async findById(id: string): Promise<ClinicWithStats> {
        const prisma = await getPrisma();

        const clinic = await prisma.clinic.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        patients: true,
                        users: true,
                    },
                },
            },
        });

        if (!clinic) {
            throw AppError.notFound('Клиника не найдена');
        }

        return clinic;
    }

    /**
     * Список клиник с пагинацией и фильтрацией
     */
    async list(
        filters: ClinicFilters,
        page: number = 1,
        limit: number = 20
    ): Promise<{ items: ClinicListItem[]; total: number }> {
        const prisma = await getPrisma();
        const skip = (page - 1) * limit;

        const where: Prisma.ClinicWhereInput = {};

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { address: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        const [items, total] = await prisma.$transaction([
            prisma.clinic.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            patients: true,
                            users: true,
                        },
                    },
                },
            }),
            prisma.clinic.count({ where }),
        ]);

        return { items, total };
    }

    /**
     * Обновление клиники
     */
    async update(id: string, data: UpdateClinicDto, updatedByUserId?: string): Promise<Clinic> {
        const prisma = await getPrisma();

        const exists = await prisma.clinic.findUnique({ where: { id } });
        if (!exists) {
            throw AppError.notFound('Клиника не найдена');
        }

        return await prisma.$transaction(async (tx) => {
            const updatedClinic = await tx.clinic.update({
                where: { id },
                data: {
                    ...data,
                    settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
                },
            });

            await tx.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entityType: 'CLINIC',
                    entityId: id,
                    userId: updatedByUserId,
                    changes: data as unknown as Prisma.InputJsonValue,
                },
            });

            logger.info({ clinicId: id }, 'Clinic updated successfully');
            return updatedClinic;
        });
    }

    /**
     * Удаление клиники
     * Разрешено только если нет Активных пациентов
     */
    async delete(id: string, deletedByUserId?: string): Promise<void> {
        const prisma = await getPrisma();

        const clinic = await prisma.clinic.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        patients: {
                            where: { status: PatientStatus.ACTIVE },
                        },
                    },
                },
            },
        });

        if (!clinic) {
            throw AppError.notFound('Клиника не найдена');
        }

        if (clinic._count.patients > 0) {
            throw AppError.conflict(
                `Нельзя удалить клинику, так как в ней есть активные пациенты (${clinic._count.patients})`
            );
        }

        await prisma.$transaction(async (tx) => {
            // Soft delete
            await tx.clinic.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });

            await tx.auditLog.create({
                data: {
                    action: 'DELETE',
                    entityType: 'CLINIC',
                    entityId: id,
                    userId: deletedByUserId,
                },
            });
        });

        logger.info({ clinicId: id }, 'Clinic soft-deleted');
    }
}

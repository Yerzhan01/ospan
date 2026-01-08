import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError, type ZodIssue } from 'zod';
import { AppError } from './AppError.js';
import { logger } from '../utils/logger.js';
import { config } from '../../config/index.js';

interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        details?: unknown;
        stack?: string;
    };
}

// Интерфейс для Prisma ошибок
interface PrismaKnownError extends Error {
    code: string;
    meta?: { target?: string[] };
}

/**
 * Проверяет, является ли ошибка Prisma ошибкой
 */
function isPrismaError(error: unknown): error is PrismaKnownError {
    return (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        typeof (error as PrismaKnownError).code === 'string' &&
        (error as PrismaKnownError).code.startsWith('P')
    );
}

/**
 * Преобразует Prisma ошибки в AppError
 */
function handlePrismaError(error: PrismaKnownError): AppError {
    switch (error.code) {
        case 'P2002': {
            const target = error.meta?.target || ['field'];
            return AppError.conflict(`Запись с таким ${target.join(', ')} уже существует`);
        }
        case 'P2025':
            return AppError.notFound('Запись не найдена');
        case 'P2003':
            return AppError.badRequest('Связанная запись не найдена');
        case 'P2014':
            return AppError.badRequest('Нарушение обязательной связи');
        default:
            return AppError.internal(`Ошибка базы данных: ${error.code}`);
    }
}

/**
 * Преобразует Zod ошибки в читаемый формат
 */
function handleZodError(error: ZodError): { appError: AppError; issues: ZodIssue[] } {
    const issues = error.issues;
    const messages = issues.map((e: ZodIssue) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
    });

    const appError = AppError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    return { appError, issues };
}

/**
 * Глобальный обработчик ошибок Fastify
 */
export function errorHandler(
    error: FastifyError | Error,
    request: FastifyRequest,
    reply: FastifyReply
): void {
    let appError: AppError;
    let details: unknown;

    // Определяем тип ошибки и конвертируем в AppError
    if (error instanceof AppError) {
        appError = error;
    } else if (error instanceof ZodError) {
        const result = handleZodError(error);
        appError = result.appError;
        details = result.issues;
    } else if (isPrismaError(error)) {
        appError = handlePrismaError(error);
    } else if (error.name === 'PrismaClientValidationError') {
        appError = AppError.badRequest('Ошибка валидации данных');
    } else if ('statusCode' in error && typeof error.statusCode === 'number') {
        appError = new AppError(
            error.message || 'Ошибка сервера',
            error.statusCode,
            (error as FastifyError).code || 'FASTIFY_ERROR'
        );
    } else {
        appError = AppError.internal(error.message || 'Неизвестная ошибка');
    }

    // Логируем ошибку
    const logData = {
        method: request.method,
        url: request.url,
        statusCode: appError.statusCode,
        code: appError.code,
        message: appError.message,
        userId: (request as unknown as { user?: { userId: string } }).user?.userId,
    };

    if (appError.statusCode >= 500) {
        logger.error(logData, 'Server error');
    } else if (appError.statusCode >= 400) {
        logger.warn(logData, 'Client error');
    }

    // Формируем ответ
    const response: ErrorResponse = {
        success: false,
        error: {
            message: appError.message,
            code: appError.code,
        },
    };

    // В dev режиме добавляем детали и stack trace
    if (config.env === 'development') {
        if (details) {
            response.error.details = details;
        }
        if (error.stack) {
            response.error.stack = error.stack;
        }
    }

    reply.status(appError.statusCode).send(response);
}

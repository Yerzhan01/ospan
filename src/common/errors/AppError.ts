/**
 * Базовый класс ошибок приложения
 * Используется для типизированных HTTP ошибок с кодами
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        // Сохраняем правильный стек вызовов
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * 400 Bad Request - Некорректный запрос
     */
    static badRequest(message: string, code = 'BAD_REQUEST'): AppError {
        return new AppError(message, 400, code);
    }

    /**
     * 401 Unauthorized - Не авторизован
     */
    static unauthorized(message = 'Требуется авторизация'): AppError {
        return new AppError(message, 401, 'UNAUTHORIZED');
    }

    /**
     * 403 Forbidden - Доступ запрещён
     */
    static forbidden(message = 'Доступ запрещён'): AppError {
        return new AppError(message, 403, 'FORBIDDEN');
    }

    /**
     * 404 Not Found - Ресурс не найден
     */
    static notFound(message: string): AppError {
        return new AppError(message, 404, 'NOT_FOUND');
    }

    /**
     * 409 Conflict - Конфликт данных
     */
    static conflict(message: string): AppError {
        return new AppError(message, 409, 'CONFLICT');
    }

    /**
     * 500 Internal Server Error - Внутренняя ошибка сервера
     */
    static internal(message = 'Внутренняя ошибка сервера'): AppError {
        return new AppError(message, 500, 'INTERNAL_ERROR');
    }
}

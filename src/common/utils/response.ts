/**
 * Интерфейс для успешного ответа
 */
interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: Record<string, unknown>;
}

/**
 * Интерфейс для ответа с ошибкой
 */
interface ErrorResponseType {
    success: false;
    error: {
        message: string;
        code?: string;
    };
}

/**
 * Интерфейс для пагинации в meta
 */
interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Интерфейс для ответа с пагинацией
 */
interface PaginatedResponse<T> {
    success: true;
    data: T[];
    meta: {
        pagination: PaginationMeta;
    };
}

/**
 * Создаёт успешный ответ
 */
export function successResponse<T>(
    data: T,
    meta?: Record<string, unknown>
): SuccessResponse<T> {
    const response: SuccessResponse<T> = {
        success: true,
        data,
    };

    if (meta) {
        response.meta = meta;
    }

    return response;
}

/**
 * Создаёт ответ с ошибкой
 */
export function errorResponse(
    message: string,
    code?: string
): ErrorResponseType {
    return {
        success: false,
        error: {
            message,
            ...(code && { code }),
        },
    };
}

/**
 * Параметры пагинации
 */
interface PaginationParams {
    page: number;
    limit: number;
    total: number;
}

/**
 * Создаёт ответ с пагинацией
 */
export function paginatedResponse<T>(
    data: T[],
    pagination: PaginationParams
): PaginatedResponse<T> {
    const { page, limit, total } = pagination;
    const totalPages = Math.ceil(total / limit);

    return {
        success: true,
        data,
        meta: {
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        },
    };
}

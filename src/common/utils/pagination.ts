/**
 * Query параметры пагинации из запроса
 */
export interface PaginationQuery {
    page?: string;
    limit?: string;
}

/**
 * Результат парсинга пагинации
 */
export interface PaginationResult {
    page: number;
    limit: number;
    skip: number;
}

/**
 * Настройки пагинации по умолчанию
 */
const PAGINATION_DEFAULTS = {
    page: 1,
    limit: 20,
    maxLimit: 100,
    minLimit: 1,
};

/**
 * Парсит параметры пагинации из query string
 * @param query - Query параметры запроса
 * @returns Объект с page, limit и skip
 */
export function parsePagination(query: PaginationQuery): PaginationResult {
    // Парсим page
    let page = parseInt(query.page || '', 10);
    if (isNaN(page) || page < 1) {
        page = PAGINATION_DEFAULTS.page;
    }

    // Парсим limit
    let limit = parseInt(query.limit || '', 10);
    if (isNaN(limit) || limit < PAGINATION_DEFAULTS.minLimit) {
        limit = PAGINATION_DEFAULTS.limit;
    } else if (limit > PAGINATION_DEFAULTS.maxLimit) {
        limit = PAGINATION_DEFAULTS.maxLimit;
    }

    // Вычисляем skip для Prisma
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
}

/**
 * Создаёт Prisma аргументы для пагинации
 */
export function paginationToPrisma(pagination: PaginationResult) {
    return {
        skip: pagination.skip,
        take: pagination.limit,
    };
}

import pino from 'pino';

// Определяем окружение
const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Конфигурация логгера Pino
 */
const loggerConfig: pino.LoggerOptions = {
    level: isTest ? 'silent' : isDev ? 'debug' : 'info',

    // Базовые поля для всех логов
    base: {
        service: 'patient-assistant',
    },

    // Форматирование timestamp
    timestamp: pino.stdTimeFunctions.isoTime,

    // В dev режиме используем pino-pretty
    ...(isDev && !isTest && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname,service',
                singleLine: false,
            },
        },
    }),
};

/**
 * Основной инстанс логгера
 */
export const logger = pino(loggerConfig);

/**
 * Создаёт дочерний логгер с дополнительным контекстом
 */
export function createLogger(bindings: pino.Bindings) {
    return logger.child(bindings);
}

/**
 * Логгер для модулей
 */
export function moduleLogger(moduleName: string) {
    return logger.child({ module: moduleName });
}

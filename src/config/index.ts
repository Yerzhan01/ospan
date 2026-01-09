import 'dotenv/config';

/**
 * Тип окружения
 */
type Environment = 'development' | 'production' | 'test';

/**
 * Конфигурация приложения
 */
interface Config {
    env: Environment;
    port: number;
    frontendUrl: string;

    database: {
        url: string;
    };

    redis: {
        url: string;
    };

    jwt: {
        secret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };

    whatsapp: {
        apiUrl: string;
        idInstance: string;
        apiToken: string;
    };

    amocrm: {
        domain: string;
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };

    ai: {
        provider: 'openai' | 'gemini';
        apiKey: string;
        model: string;
    };

    alerts: {
        escalationThresholdHours: number;
    };

    transcription: {
        enabled: boolean;
        openaiApiKey: string;
    };
}

/**
 * Получает переменную окружения или выбрасывает ошибку
 */
/**
 * Получает переменную окружения или выбрасывает ошибку
 */
export function getEnvVar(name: string, required = true): string {
    const value = process.env[name];

    if (required && !value) {
        throw new Error(`Отсутствует обязательная переменная окружения: ${name}`);
    }

    return value || '';
}

/**
 * Получает переменную окружения или возвращает значение по умолчанию
 */
export function getEnvVarWithDefault(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

/**
 * Определяет текущее окружение
 */
function getEnvironment(): Environment {
    const env = process.env.NODE_ENV;

    if (env === 'production') return 'production';
    if (env === 'test') return 'test';

    return 'development';
}

/**
 * Конфигурация приложения
 */
export const config: Config = {
    env: getEnvironment(),
    port: parseInt(getEnvVarWithDefault('PORT', '3000'), 10),
    frontendUrl: getEnvVarWithDefault('FRONTEND_URL', 'http://localhost:3000'),

    database: {
        url: getEnvVar('DATABASE_URL'),
    },

    redis: {
        url: getEnvVarWithDefault('REDIS_URL', 'redis://localhost:6379'),
    },

    jwt: {
        secret: getEnvVar('JWT_SECRET'),
        accessExpiresIn: getEnvVarWithDefault('JWT_ACCESS_EXPIRES_IN', '15m'),
        refreshExpiresIn: getEnvVarWithDefault('JWT_REFRESH_EXPIRES_IN', '7d'),
    },

    whatsapp: {
        apiUrl: getEnvVarWithDefault('WHATSAPP_API_URL', 'https://api.green-api.com'),
        idInstance: getEnvVarWithDefault('WHATSAPP_INSTANCE_ID', ''),
        apiToken: getEnvVarWithDefault('WHATSAPP_API_TOKEN', ''),
    },

    amocrm: {
        domain: getEnvVarWithDefault('AMOCRM_SUBDOMAIN', ''),
        clientId: getEnvVarWithDefault('AMOCRM_CLIENT_ID', ''),
        clientSecret: getEnvVarWithDefault('AMOCRM_CLIENT_SECRET', ''),
        redirectUri: getEnvVarWithDefault('AMOCRM_REDIRECT_URI', ''),
    },

    ai: {
        provider: (getEnvVarWithDefault('AI_PROVIDER', 'gemini') as 'openai' | 'gemini'),
        apiKey: getEnvVarWithDefault('AI_API_KEY', getEnvVarWithDefault('GEMINI_API_KEY', '')),
        model: getEnvVarWithDefault('AI_MODEL', 'gemini-2.0-flash'),
    },

    alerts: {
        escalationThresholdHours: parseInt(getEnvVarWithDefault('ESCALATION_THRESHOLD_HOURS', '4'), 10),
    },

    transcription: {
        enabled: getEnvVarWithDefault('TRANSCRIPTION_ENABLED', 'false') === 'true',
        openaiApiKey: getEnvVarWithDefault('OPENAI_API_KEY', ''),
    },
};

/**
 * Валидирует обязательные переменные при старте
 */
export function validateConfig(): void {
    const errors: string[] = [];

    if (!config.database.url) {
        errors.push('DATABASE_URL is required');
    }

    if (!config.jwt.secret) {
        errors.push('JWT_SECRET is required');
    }

    if (errors.length > 0) {
        throw new Error(`Ошибки конфигурации:\n${errors.join('\n')}`);
    }
}

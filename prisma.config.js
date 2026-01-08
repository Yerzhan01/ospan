import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// URL базы данных
console.log('DEBUG: DATABASE_URL from env:', process.env.DATABASE_URL);
const dbUrl = process.env.DATABASE_URL;

export default defineConfig({
    earlyAccess: true,
    schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),

    // URL для работы с базой данных (для db push, migrate и т.д.)
    datasource: {
        url: dbUrl,
    },

    // Настройки миграций и seed
    migrations: {
        // Команда seed
        seed: 'npx tsx prisma/seed.ts',
    },

    // Адаптер для миграций
    migrate: {
        async adapter() {
            const { PrismaPg } = await import('@prisma/adapter-pg');
            const pg = await import('pg');

            const pool = new pg.default.Pool({
                connectionString: dbUrl,
            });

            return new PrismaPg(pool);
        },
    },
});

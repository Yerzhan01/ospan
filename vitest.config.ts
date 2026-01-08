import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['test/**/*.test.ts', '**/*.test.ts'],
        setupFiles: ['./test/utils/setup.ts'],
        exclude: ['node_modules', 'dist', 'frontend'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules', 'dist', 'frontend', 'test', 'vitest.config.ts'],
        },
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

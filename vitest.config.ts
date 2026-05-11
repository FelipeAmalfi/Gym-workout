import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/index.ts'],
            reporter: ['text', 'lcov', 'html'],
        },
        projects: [
            {
                test: {
                    name: 'unit',
                    include: ['tests/unit/**/*.test.ts'],
                    environment: 'node',
                },
            },
            {
                test: {
                    name: 'integration',
                    include: ['tests/integration/**/*.test.ts'],
                    environment: 'node',
                    pool: 'forks',
                    fileParallelism: false,
                    testTimeout: 60_000,
                    hookTimeout: 180_000,
                    globalSetup: ['./tests/setup/globalSetup.ts'],
                },
            },
            {
                test: {
                    name: 'graph',
                    include: ['tests/graph/**/*.test.ts'],
                    environment: 'node',
                    pool: 'forks',
                    fileParallelism: false,
                    testTimeout: 60_000,
                    hookTimeout: 180_000,
                    globalSetup: ['./tests/setup/globalSetup.ts'],
                },
            },
            {
                test: {
                    name: 'api',
                    include: ['tests/api/**/*.test.ts'],
                    environment: 'node',
                    pool: 'forks',
                    fileParallelism: false,
                    testTimeout: 60_000,
                    hookTimeout: 180_000,
                    globalSetup: ['./tests/setup/globalSetup.ts'],
                },
            },
            {
                test: {
                    name: 'infra',
                    include: ['tests/infra/**/*.test.ts'],
                    environment: 'node',
                    pool: 'forks',
                    fileParallelism: false,
                    testTimeout: 180_000,
                    hookTimeout: 240_000,
                },
            },
        ],
    },
});

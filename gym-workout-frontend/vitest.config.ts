import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react() as never],
    resolve: {
        alias: { '@': path.resolve(__dirname, '.') },
    },
    test: {
        environment: 'jsdom',
        globals: false,
        include: ['tests/component/**/*.{test,spec}.{ts,tsx}'],
        setupFiles: ['tests/component/setup.ts'],
        css: false,
    },
});

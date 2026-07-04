import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            fileName: format => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
            formats: ['es', 'cjs'],
        },
    },
    test: {
        globals: true,
        include: ['src/tests/*.test.ts'],
        setupFiles: ['vitest-setup.js'],
        coverage: {
            enabled: process.env.npm_config_coverage === 'true',
        }
    },
});

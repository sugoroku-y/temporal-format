// @ts-check
import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

export default defineConfig([
    {
        plugins: [
            dts({
                tsconfig: './tsconfig.lib.json',
                emitDtsOnly: true,
            }),
        ],
        input: 'src/index.ts',
        checks: {
            pluginTimings: false,
        },
        output: {
            dir: 'dist',
            format: 'es',
        },
    },
]);

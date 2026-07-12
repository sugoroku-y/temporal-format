// @ts-check
import js from '@eslint/js';
import gitignore from 'eslint-config-flat-gitignore';
import esX from 'eslint-plugin-es-x';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    gitignore(),
    globalIgnores(['dist/', `docs/`], 'Outputs'),
    prettier,
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: { globals: globals.browser },
    },
    tseslint.configs.eslintRecommended,
    tseslint.configs.recommended,
    tseslint.configs.strict,
    {
        plugins: {
            'es-x': esX,
            'import-x': importX,
        },
        languageOptions: {
            ecmaVersion: 2024,
        },
        rules: {
            // 正規表現の後読みアサーションはSafari16.4以降対応で、まだサポートされていない端末が現役の可能性があるため使用禁止
            // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Regular_expressions/Lookbehind_assertion#%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%83%BC%E3%81%AE%E4%BA%92%E6%8F%9B%E6%80%A7
            'es-x/no-regexp-lookbehind-assertions': 'error',
            // 正規表現の名前付きキャプチャーグループは重複する名前の扱いがSafariのバージョンによって異なるため使用禁止
            // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group#%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%83%BC%E3%81%AE%E4%BA%92%E6%8F%9B%E6%80%A7
            'es-x/no-regexp-named-capture-groups': 'error',
            // 正規表現のdフラグはSafari11.3以降対応で、まだサポートされていない端末が現役の可能性があるため使用禁止
            // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices#%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%83%BC%E3%81%AE%E4%BA%92%E6%8F%9B%E6%80%A7
            'es-x/no-regexp-d-flag': 'error',
            // 使用しない変数や引数でも_で始まる名前のものは許可
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
]);

// @ts-check

/** @type {import('prettier').Config} */
export default {
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'avoid',
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    overrides: [
        {
            files: '*.md',
            options: {
                tabWidth: 2,
            },
        },
    ],
};

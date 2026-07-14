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
            files: ['*.md', 'package.json'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};

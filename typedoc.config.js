// @ts-check

/** @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').PluginOptions} */
export default {
    plugin: ['typedoc-plugin-markdown'],
    tsconfig: 'tsconfig.lib.json',
    out: 'docs',
    disableSources: true,
    entryPoints: ['src/index.ts'],
    readme: 'none',
    entryFileName: 'index.md',
    headings: false,
    hidePageHeader: true,
    hideBreadcrumbs: true,
    intentionallyNotExported: [
        'TargetFor',
        'ReferenceFor',
        'ValidateFormatString',
        'LOCALES',
    ],
    lang: 'ja',
    locales: {
        ja: {
            // デフォルトの日本語訳ではテキスト校正くんでエラーになるので差し替え
            kind_plural_property: 'プロパティ',
            kind_plural_parameter: 'パラメーター',
            // Throwsの訳語が用意されていなかったので追加
            tag_throws: '例外',
            // 訳語のないメッセージ
            output_0_generated_at_1: '{0}は{1}に出力されました。'
        },
    },
};

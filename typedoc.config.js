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
    intentionallyNotExported: [
        'TargetFor',
        'ValidateFormatString',
        'LOCALES',
        'FormatTarget',
        'RequiredProperties',
    ],
    validation: {
        invalidPath: false,
    },
    cleanOutputDir: false,
    hidePageHeader: true,
    hideBreadcrumbs: true,
    lang: 'ja',
    locales: {
        ja: {
            kind_property: 'プロパティ',
            kind_plural_property: 'プロパティ',
            kind_plural_parameter: 'パラメーター',
            tag_throws: '例外',
            comment_for_0_links_to_1_not_included_in_docs_use_external_link_2:
                '{0} に関するコメントには「{1}」へのリンクが含まれていますが、これは解決済みであるものの、ドキュメントには記載されていません。この警告を解消するには、それをエクスポートするか、{2} を externalSymbolLinkMappings オプションに追加してください。',
        },
    },
};

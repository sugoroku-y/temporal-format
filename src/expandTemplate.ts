import type { Expect, It, ToEqual } from './type-test';

type TemplateType = (string | [string])[];

type AddToken<Template extends TemplateType, Token extends string> = [
    ...Template,
    [Token],
];
type AddLiteral<
    Template extends TemplateType,
    Literal extends string,
> = Template extends [...infer Pre, infer Last extends string]
    ? [...Pre, `${Last}${Literal}`]
    : [...Template, Literal];
type ParseTemplate<
    S extends string,
    Result extends TemplateType = [],
> = S extends `${infer First}${infer Post}`
    ? First extends '$'
        ? Post extends `${First}${infer Post2}`
            ? ParseTemplate<Post2, AddLiteral<Result, First>>
            : Post extends `{${infer Token}}${infer Post2}`
              ? ParseTemplate<Post2, AddToken<Result, Token>>
              : ParseTemplate<Post, AddLiteral<Result, First>>
        : ParseTemplate<Post, AddLiteral<Result, First>>
    : Result;
type TemplateTypeToParameterType<Template extends TemplateType> = Record<
    Extract<Template[number], [string]>[0],
    string | number
>;
export type TemplateParameter<S extends string> = TemplateTypeToParameterType<
    ParseTemplate<S>
>;
type ApplyTemplate<
    Template extends TemplateType,
    Parameters extends Record<string, string | number>,
> = Template extends [infer First, ...infer Post extends TemplateType]
    ? `${First extends string
          ? First
          : First extends [infer Token]
            ? Token extends keyof Parameters
                ? Parameters[Token]
                : ''
            : never}${ApplyTemplate<Post, Parameters>}`
    : '';
export type ExpandTemplate<
    S extends string,
    Parameters extends TemplateParameter<S> = TemplateParameter<S>,
> = ApplyTemplate<ParseTemplate<S>, Parameters>;

declare const _test_ExpandTemplate: [
    ...It<
        '通常の使用方法',
        Expect<
            ExpandTemplate<
                'abc${def}ghi${jkl}$${mno}',
                { def: '!"#'; jkl: 456 }
            >,
            ToEqual<'abc!"#ghi456${mno}'>
        >
    >,
    ...It<
        'パラメーターなし',
        Expect<
            ExpandTemplate<'abcdefghijklmno', { def: '!"#'; jkl: 456 }>,
            ToEqual<'abcdefghijklmno'>
        >
    >,
    ...It<
        '存在しないパラメーターは空文字列に変換',
        Expect<
            ExpandTemplate<
                'abc${def}ghi${jkl}$${mno}',
                // @ts-expect-error 不足しているパラメーターを指定するため
                { def: '!"#' }
            >,
            ToEqual<'abc!"#ghi${mno}'>
        >
    >,
];

/**
 * テンプレート文字列に指定パラメーターを適用して展開する。
 * @param template テンプレート文字列
 * @param parameters 適用するパラメーター
 * @returns 指定パラメーターを適用して展開したテンプレート文字列
 */
export function expandTemplate<
    const S extends string,
    const Parameters extends TemplateParameter<S>,
>(
    template: S,
    ..._: S extends `${string}$${string}`
        ? [parameters: NoInfer<Parameters>]
        : [parameters?: NoInfer<Parameters>]
): ExpandTemplate<S, Parameters>;
export function expandTemplate(
    template: string,
    parameters: Record<string, string | number> = {},
): string {
    return template.replace(/\$(?:\$|\{(.*?)\})/g, (match, token) => {
        if (match === '$$') {
            return '$';
        }
        if (
            token in parameters &&
            (typeof parameters[token] === 'string' ||
                typeof parameters[token] === 'number')
        ) {
            return String(parameters[token]);
        }
        return '';
    });
}

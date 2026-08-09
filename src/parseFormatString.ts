import { assert } from './asserts';
import { error } from './error';
import type { ExpandTemplate } from './expandTemplate';
import { messageKeys, messages } from './messages';
import { throwMessage } from './TemporalFormatError';
import type { Expect, It, ToEqual } from './type-test';
import type { Alphabet, FailoverIfNever, Increment, Repeat } from './types';

/** 書式指定のノード */
export type TokenNode<
    Char extends string = string,
    Length extends number = number,
> = [Char, Length];

/** リテラル文字列のノード */
export type LiteralNode<Literal extends string = string> = Literal;

/** 書式文字列を解析した結果(成功時) */
export type SuccessResult<
    Node extends TokenNode | LiteralNode = TokenNode | LiteralNode,
> = Node[];

/** 解析結果(失敗時) */
export interface FailureResult<Message extends string = string> {
    error: Message;
}

export type ParseResult = SuccessResult | FailureResult;

type AddToken<R extends SuccessResult, Char extends Alphabet> =
    // 最後のNodeが同じ文字の書式指定子なら
    R extends [...infer Pre, TokenNode<Char, infer Last extends number>]
        ? [...Pre, TokenNode<Char, Increment<Last>>]
        : [...R, TokenNode<Char, 1>];

declare const _tests_AddToken: [
    ...It<
        '1. AddToken: 空だったら、新しいノードとして追加',
        Expect<AddToken<[], 'M'>, ToEqual<[TokenNode<'M', 1>]>>
    >,
    ...It<
        '2. AddToken: 同じ文字の書式指定子が最後なら、最後のノードに1文字追加',
        Expect<AddToken<[TokenNode<'M', 1>], 'M'>, ToEqual<[TokenNode<'M', 2>]>>
    >,
    ...It<
        '3. AddToken: リテラル文字列が最後なら、新しいノードとして追加',
        Expect<
            AddToken<[LiteralNode<'abc'>], 'M'>,
            ToEqual<[LiteralNode<'abc'>, TokenNode<'M', 1>]>
        >
    >,
    ...It<
        '4. AddToken: 違う文字の書式指定子が最後なら、新しいノードとして追加',
        Expect<
            AddToken<[TokenNode<'m', 1>], 'M'>,
            ToEqual<[TokenNode<'m', 1>, TokenNode<'M', 1>]>
        >
    >,
];

type AddLiteral<R extends SuccessResult, Literal extends string> =
    // 最後のNodeがリテラル文字列なら
    R extends [...infer Pre, LiteralNode<infer Last>]
        ? [...Pre, LiteralNode<`${Last}${Literal}`>]
        : [...R, LiteralNode<Literal>];

declare const _tests_AddLiteral: [
    ...It<
        '1. AddLiteral: 空だったら、新しいノードとして追加',
        Expect<AddLiteral<[], 'hello'>, ToEqual<[LiteralNode<'hello'>]>>
    >,
    ...It<
        '2. AddLiteral: リテラル文字列が最後なら、最後のリテラル文字列に文字列を追加',
        Expect<
            AddLiteral<[LiteralNode<'hello'>], ' world'>,
            ToEqual<[LiteralNode<'hello world'>]>
        >
    >,
    ...It<
        '3. AddLiteral: 書式文字列が最後なら、新しいノードとして追加',
        Expect<
            AddLiteral<[TokenNode<'yyyy'>], ' world'>,
            ToEqual<[TokenNode<'yyyy'>, LiteralNode<' world'>]>
        >
    >,
];

/** 書式文字列を解析 */
export type ParseFormatString<S extends string, R extends SuccessResult = []> =
    // 先頭の1文字を抽出
    S extends `${infer First}${infer Rest}`
        ? // 先頭の文字が引用符
          First extends "'" | '"'
            ? // 次の文字も同じなら
              Rest extends `${First}${infer Rest2}`
                ? // 引用符1文字をリテラル文字列に追加して続行
                  ParseFormatString<Rest2, AddLiteral<R, First>>
                : // クォートされたリテラル文字列の解析に移行
                  ParseQuotedLiteral<Rest, First, R>
            : // それ以外の文字は結果に適宜追加して続行
              ParseFormatString<
                  Rest,
                  // 先頭がアルファベットなら
                  First extends Alphabet
                      ? // 書式指定子として追加
                        AddToken<R, First>
                      : // リテラル文字列として追加
                        AddLiteral<R, First>
              >
        : // 最後まで行ったら結果を返す
          R;

/** 書式文字列中の引用符内を解析 */
type ParseQuotedLiteral<
    S extends string,
    Q extends "'" | '"',
    R extends SuccessResult,
> =
    // 先頭の1文字を抽出
    S extends `${infer First}${infer Rest}`
        ? // 先頭は引用符
          First extends "'" | '"'
            ? // 次の文字も同じなら
              Rest extends `${First}${infer Rest2}`
                ? // リテラル文字列に引用符1文字追加して続行
                  ParseQuotedLiteral<Rest2, Q, AddLiteral<R, First>>
                : // 開始した引用符と同じ
                  First extends Q
                  ? // 引用符終了
                    ParseFormatString<Rest, R>
                  : // 開始と違う引用符はエラー
                    FailureResult<
                        ExpandTemplate<
                            typeof messages.independentQuote,
                            { quote: First }
                        >
                    >
            : // リテラル文字列に1文字追加して続行
              ParseQuotedLiteral<Rest, Q, AddLiteral<R, First>>
        : // 引用符が来ないのに終了したらエラー
          FailureResult<
              ExpandTemplate<typeof messages.unclosedQuote, { quote: Q }>
          >;

declare const _tests_ParseFormatString: [
    ...It<
        '1. ParseFormatString: 一般的な書式文字列',
        Expect<
            ParseFormatString<'yyyy-MM-dd'>,
            ToEqual<
                [
                    TokenNode<'y', 4>,
                    LiteralNode<'-'>,
                    TokenNode<'M', 2>,
                    LiteralNode<'-'>,
                    TokenNode<'d', 2>,
                ]
            >
        >
    >,
    ...It<
        '2. ParseFormatString: リテラル文字列だけ',
        Expect<
            ParseFormatString<"'hello''world'">,
            ToEqual<[LiteralNode<"hello'world">]>
        >
    >,
    ...It<
        '3. ParseFormatString: 閉じらてていない引用符',
        Expect<
            ParseFormatString<"'closed' 'unclosed yyyy">,
            ToEqual<FailureResult<"引用符'が閉じられていません">>
        >
    >,
    ...It<
        '4. ParseFormatString: 閉じられている引用符のあとにリテラル文字列としての引用符',
        Expect<
            ParseFormatString<"'closed' ''yyyy">,
            ToEqual<[LiteralNode<"closed '">, TokenNode<'y', 4>]>
        >
    >,
];

export type ExtractToken<R extends ParseResult> =
    R extends SuccessResult<infer Parsed extends TokenNode | LiteralNode>
        ? FailoverIfNever<Extract<Parsed, TokenNode>, ['no-token']>
        : ['failure'];

export type TokenNodeToString<Token extends TokenNode> = Token extends Token
    ? Repeat<Token[0], Token[1]>
    : never;

type CacheEntry = { result: SuccessResult } | { result?: never; error: string };

const cache = new Map<string, CacheEntry>();

export function parseFormatString(formatString: string): SuccessResult {
    const cached = cache.get(formatString);
    if (cached) {
        return cached.result ?? error(cached.error);
    }
    try {
        let hasToken = false;
        const nodes: SuccessResult = [];
        const addToken = (token: TokenNode) => {
            nodes.push(token);
            hasToken = true;
        };
        const addLiteral = (literal: string) => {
            if (
                nodes.length > 0 &&
                typeof nodes[nodes.length - 1] === 'string'
            ) {
                nodes[nodes.length - 1] += literal;
            } else {
                nodes.push(literal);
            }
        };
        let lastIndex = 0;
        for (const {
            index,
            0: match,
            1: char,
            2: quote,
            3: content,
            4: endQuote,
        } of formatString.matchAll(
            /([A-Za-z])\1*|(['"])([^'"]*(?:(?:''|"")[^'"]*)*)(['"]|$)/g,
        )) {
            if (lastIndex < index) {
                addLiteral(formatString.slice(lastIndex, index));
            }
            lastIndex = index + match.length;
            if (match === "''" || match === '""') {
                addLiteral(match.charAt(0));
                continue;
            }
            if (quote) {
                if (!endQuote) {
                    throwMessage(messageKeys.unclosedQuote, {
                        quote,
                    });
                }
                if (quote !== endQuote) {
                    throwMessage(messageKeys.independentQuote, {
                        quote: endQuote,
                    });
                }
                addLiteral(content.replace(/(['"])\1/g, '$1'));
                continue;
            }
            addToken([char, match.length]);
        }
        if (lastIndex < formatString.length) {
            addLiteral(formatString.slice(lastIndex));
        }
        if (!hasToken) {
            throwMessage(messageKeys.noFormatToken);
        }
        cache.set(formatString, { result: nodes });
        return nodes;
    } catch (ex) {
        assert(
            ex instanceof Error,
            'eslintの設定でthrowされるものはError派生のはず',
        );
        cache.set(formatString, { error: ex.message });
        throw ex;
    }
}

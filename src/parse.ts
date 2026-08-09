import type { FormatTarget } from './FormatTarget';
import type { ReferenceFor } from './TargetFor';
import { throwMessage } from './TemporalFormatError';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    CHAR_TO_2DIGIT_TOKEN,
    CHAR_TO_PATTERN,
    FORMAT_TOKEN_MAP,
    LOCALES,
    ORDER_PROPERTIES,
    PATTERNS,
    type FormatTokenMap,
    type Locale,
    type ParsedFormatString,
    type WithValue,
} from './constants';
import { entry as entryBase } from './entry';
import { error } from './error';
import { isKeyOf } from './isKeyOf';
import { lazy } from './lazy';
import { messageKeys } from './messages';
import { parseAndValidate } from './parseAndValidate';
import type { UnionToIntersection } from './types';

interface ParseContext {
    readonly input: string;
    readonly locale: Locale;
    readonly result: WithValue;
    index: number;
    isPm?: boolean;
    referenceYear?: number;
    offset?: string;
}

/**
 * 解析に使用するオプション
 */
export interface ParseOptions {
    /** 解析時に使用するオプション {@link Locale} */
    locale?: Locale;
    /**
     * 範囲外の値の扱いを指定するオプション
     *
     * 以下が指定できます。
     *
     * - `reject` 範囲外の値が指定されたら受け付けない(`undefined`を返す): デフォルト
     * - `constrain` 範囲内に収まるように調整して受け付ける
     *
     * 上記以外を指定するとエラーになります。
     */
    overflow?: 'reject' | 'constrain';
}

function scanLiteral(context: ParseContext, literal: string) {
    if (!context.input.startsWith(literal, context.index)) {
        // 文字列が一致しない場合はundefinedを返す
        return false;
    }
    context.index += literal.length;
    return true;
}

function scanPattern(context: ParseContext, pattern: RegExp) {
    assert(
        pattern.global && pattern.sticky,
        lazy`scanPatternに指定するパターンにはgとyのフラグを指定すること: ${pattern}`,
    );
    pattern.lastIndex = context.index;
    const match = pattern.exec(context.input);
    if (!match) {
        return null;
    }
    context.index += match[0].length;
    return match;
}

function scanWithTable(
    context: ParseContext,
    array: readonly string[],
): [index: number, value: string] | undefined;
function scanWithTable(
    context: ParseContext,
    array: Readonly<Record<string, string>>,
): [key: string, value: string] | undefined;
function scanWithTable(
    context: ParseContext,
    array: readonly string[] | Readonly<Record<string, string>>,
): [string | number, string] | undefined {
    for (const [index, name] of Array.isArray(array)
        ? array.entries()
        : Object.entries(array)) {
        if (scanLiteral(context, name)) {
            return [index, name];
        }
    }
    return undefined;
}

function adjustYear(thisYear: number, year2digit: number): number {
    const threshold = thisYear + 50;
    const century =
        Math.floor(threshold / 100) - (year2digit < threshold % 100 ? 0 : 1);
    return year2digit + century * 100;
}

type ParseFunction<Char extends keyof FormatTokenMap> = UnionToIntersection<
    Char extends Char
        ? (
              context: ParseContext,
              token: [Char, FormatTokenMap[Char]['length'][number]],
          ) => void
        : never
>;

const entry: <Char extends keyof FormatTokenMap>(
    chars: Char | Char[],
    func: ParseFunction<Char>,
) => Record<Char, ParseFunction<Char>> = entryBase;

const parseMap = {
    ...entry('y', (context, [, length]) => {
        const [yearString] =
            scanPattern(context, PATTERNS.year[length]) ??
            error`年が見つからない`;
        const year = parseInt(yearString, 10);
        if (length === 4) {
            context.result.year = year;
            return;
        }
        assert(
            context.referenceYear != null,
            'yearを使う書式指定子が使われているならreferenceがyearプロパティを持っているはず',
        );
        context.result.year = adjustYear(context.referenceYear, year);
    }),
    ...entry('M', (context, [, length]) => {
        if (length === 1 || length === 2) {
            const [month] =
                scanPattern(context, PATTERNS.month[length]) ??
                error`月が見つからない`;
            context.result.monthCode = `M${month.padStart(2, '0')}`;
            return;
        }
        const type = length === 3 ? 'short' : 'long';
        const names = LOCALES[context.locale].month[type];
        const [monthCode] =
            scanWithTable(context, names) ?? error`月が見つからない`;
        context.result.monthCode = monthCode;
    }),
    ...entry(CHAR_TO_2DIGIT_TOKEN, (context, [char, length]) => {
        const re = PATTERNS[CHAR_TO_PATTERN[char]][length];
        const property = FORMAT_TOKEN_MAP[char]['properties'][0];
        const [num] =
            scanPattern(context, re) ??
            error`${property}プロパティが見つからない`;
        context.result[property] = parseInt(num, 10);
    }),
    ...entry('a', context => {
        const [index] =
            scanWithTable(context, LOCALES[context.locale].dayPeriod.amPm) ??
            error`午前午後が見つからない`;
        context.isPm = index === 1;
    }),
    ...entry('S', (context, [, length]) => {
        const [match] =
            scanPattern(context, PATTERNS.fractionSecond[length]) ??
            error`秒の小数部が見つからない`;
        context.result.millisecond = parseInt(
            match.slice(0, 3).padEnd(3, '0'),
            10,
        );
        context.result.microsecond =
            match.length > 3
                ? parseInt(match.slice(3, 6).padEnd(3, '0'), 10)
                : 0;
        context.result.nanosecond =
            match.length > 6
                ? parseInt(match.slice(6, 9).padEnd(3, '0'), 10)
                : 0;
    }),
    ...entry('E', (context, [, length]) => {
        const type = length === 4 ? 'long' : 'short';
        if (!scanWithTable(context, LOCALES[context.locale].dayOfWeek[type])) {
            void error`曜日が見つからない`;
        }
        // 曜日は解析の結果には含めないので、context.resultは更新しない
    }),
    ...entry(['X', 'x'], (context, [char, length]) => {
        if (char === 'X' && scanLiteral(context, 'Z')) {
            context.offset = '+00:00';
            return;
        }
        [context.offset] =
            scanPattern(context, PATTERNS.offset[length]) ??
            error`タイムゾーンが見つからない`;
    }),
} as const satisfies {
    [Char in keyof FormatTokenMap]: ParseFunction<Char>;
};

/**
 * 指定されたプロパティよりも下位のプロパティをリセットする
 */
function initializeSubordinateProperties({ result }: ParseContext) {
    let found = false;
    for (const name of ORDER_PROPERTIES) {
        if (name in result) {
            // 指定されているプロパティはリセットしない
            // フラグだけは立てておく
            found ||= true;
            continue;
        }
        if (!found) {
            // 指定されている最上位のプロパティより上位のプロパティはリセットしない
            continue;
        }
        if (name === 'monthCode') {
            // monthCodeだけは文字列なので特別扱い
            result.monthCode = 'M01';
            continue;
        }
        // 日は初期値が1、それ以外は0(yearより上位のプロパティはないのでyearは考慮しなくて良い)
        result[name] = name === 'day' ? 1 : 0;
    }
}

function parseInput(context: ParseContext, nodes: ParsedFormatString) {
    for (const node of nodes) {
        if (typeof node === 'string') {
            // リテラル文字列は文字列が一致するかどうかだけ
            if (!scanLiteral(context, node)) {
                void error`一致しないリテラル文字列: ${node}`;
            }
            continue;
        }

        const [char] = node;
        const parseFunc = parseMap[char] as (
            c: typeof context,
            t: typeof node,
        ) => void;
        parseFunc(context, node);
    }
    if (context.index < context.input.length) {
        void error`余分な文字列があります: ${context.input.slice(context.index)}`;
    }

    if (context.isPm !== undefined) {
        const hour = context.result.hour;
        assert(
            hour !== undefined,
            '書式チェックにより、午前午後が指定されていれば時間も指定されているはず',
        );
        // 13以上にはならないはず
        if (hour === 12) {
            if (!context.isPm) {
                // 午前12時は0時にする
                context.result.hour = 0;
            }
        } else {
            // !==12なので1〜11時
            if (context.isPm) {
                // 午後1〜11時は12時間加算する
                context.result.hour = hour + 12;
            }
        }
    }
    // 指定されたプロパティよりも下位のプロパティをリセット
    initializeSubordinateProperties(context);
}

type EnableNonExistPropertyAccessing<
    T,
    AllKeys extends PropertyKey = T extends T ? keyof T : never,
> = T extends T
    ? T & Partial<Readonly<Record<Exclude<AllKeys, keyof T>, never>>>
    : never;
/**
 * 指定された書式文字列にしたがって、文字列を日付時刻に変換します。
 *
 * 入力文字列が書式文字列にしたがっていない場合はundefinedを返します。
 *
 * `E`や`EEEE`はその位置に曜日の表記がないとundefinedを返しますが、日付の解析の際には無視されます。
 *
 * たとえば、2023/01/01は日曜日ですが、`'2023-01-01 (Mon)'` は書式文字列 `'yyyy-MM-dd (EEE)'` にしたがっているため、解析結果は`undefined`にはならず、また日付にも影響しないため`2023/1/1`となります。
 *
 * 日時や時刻に変換される書式文字列が指定されていないと、つまり曜日やタイムゾーンの書式文字列だけだとエラーになります。
 *
 * また`a`(午前・午後)と`h`や`hh`(12時間制の時)はセットで使用していないとエラーになります。
 *
 * 書式からの解析が不安定になるため同じアルファベットの書式指定子を複数箇所で使用しているとエラーになります。
 * @template F 書式文字列の型
 * @template T 解析の基準となる日付時刻の型。返り値の型にもなります。
 * @param input 解析する文字列
 * @param formatString 文字列から変換するための{@link FormatString 書式文字列}
 * @param reference 解析の基準となる日付時刻。
 * @param options 解析時に使用するオプション
 * @param _ 書式文字列の検査のための引数。この引数を指定する必要はありません。
 * @returns 書式にしたがって文字列から変換されたTemporalのインスタンス
 *
 * 書式文字列にタイムゾーンの書式指定子が指定されている場合
 * 入力文字列から解析された日付や時刻の値がそのタイムゾーンで解釈され
 * referenceと同じタイムゾーンに変換したものを返します。
 * @throws 以下の場合に例外が投げられます
 *
 * - 書式文字列に文字列リテラルだけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
 * - 書式文字列に日時や時刻に変換されるがアルファベットが指定されていない
 * - 書式文字列に`a`(午前・午後)が指定されているのに`h`や`hh`(12時間制の時)が指定されていない
 * - 書式文字列に`h`もしくは`hh`(12時間制の時)が指定されているのに`a`(午前・午後)が指定されていない
 * - 書式文字列に`h`もしくは`hh`(12時間制の時)と`H`もしくは`HH`(24時間制の時)が同時に指定されている
 * - 書式文字列に同じアルファベットの書式指定子を複数箇所で使用している
 * - 未対応のロケールを指定した
 * - 未対応のoverflow
 * @see {@link format}
 */
export function parse<F extends string, T extends _T, _T = ReferenceFor<F>>(
    input: string,
    formatString: F,
    reference: T,
    options?: ParseOptions,
    ..._: ValidateFormatString<F, 'parse'>
): T | undefined;
// parse関数の実装
export function parse(
    input: string,
    formatString: string,
    reference: EnableNonExistPropertyAccessing<FormatTarget>,
    { locale = 'en-US', overflow = 'reject' }: ParseOptions = {},
): FormatTarget | undefined {
    if (!isKeyOf(locale, LOCALES)) {
        throwMessage(messageKeys.unsupportedLocale, {
            locale,
        });
    }
    if (overflow !== 'constrain' && overflow !== 'reject') {
        throwMessage(messageKeys.unsupportedOverflow, { overflow });
    }
    if (
        reference.calendarId !== undefined &&
        reference.calendarId !== 'iso8601'
    ) {
        throwMessage(messageKeys.unsupportedCalendarId, {
            calendarId: reference.calendarId,
        });
    }

    // 書式文字列を解析
    const nodes = parseAndValidate(formatString, reference, 'parse');

    const context: ParseContext = {
        input,
        index: 0,
        locale,
        result: {},
        referenceYear: reference.year,
    };
    try {
        parseInput(context, nodes);
        if (context.offset !== undefined) {
            // タイムゾーンの指定があれば
            return (
                reference
                    // そのタイムゾーンに変更してから
                    .withTimeZone?.(context.offset)
                    // 日付時刻を設定し
                    .with(context.result, { overflow })
                    // もとのタイムゾーンに戻す
                    .withTimeZone(reference)
            );
        } else {
            // タイムゾーンがなければ日付時刻の設定だけ
            return reference.with(context.result, { overflow });
        }
    } catch (ex) {
        assert(
            ex instanceof Error,
            'eslintの設定でthrowされるものはError派生のはず',
        );
        console.log(
            `${context.input}\n${' '.repeat(context.index)}^\n${ex.stack}`,
        );
        // 解析結果が不正な場合はundefinedを返す
        return undefined;
    }
}

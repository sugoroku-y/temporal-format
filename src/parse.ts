import type { FormatTarget } from './FormatTarget';
import type { ReferenceFor } from './TargetFor';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    LOCALES,
    ORDER_PROPERTIES,
    type FormatTokenMap,
    type Locale,
    type WithValue,
} from './constants';
import { error } from './error';
import { isKeyOf } from './isKeyOf';
import {
    parseFormatString,
    type ParsedFormatString,
} from './parseFormatString';
import type { NumberProperties } from './types';
import { validateProperties } from './validateProperties';

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
        `Pattern must have 'g' and 'y' flags: ${pattern}`,
    );
    pattern.lastIndex = context.index;
    const match = pattern.exec(context.input);
    if (!match) {
        return null;
    }
    context.index += match[0].length;
    return match;
}

function parseWithArray(
    context: ParseContext,
    array: readonly string[],
    label: string,
): [index: number, name: string] {
    for (const [index, name] of array.entries()) {
        if (scanLiteral(context, name)) {
            return [index, name];
        }
    }
    error(`${label} not found`);
}

function adjustYear(thisYear: number, year2digit: number): number {
    const threshold = thisYear + 50;
    const century =
        Math.floor(threshold / 100) - (year2digit < threshold % 100 ? 0 : 1);
    return year2digit + century * 100;
}

function parseYear(context: ParseContext, length: 2 | 4) {
    const [yearString] =
        scanPattern(
            context,
            {
                2: /\d{2}/gy,
                4: /\d{4}/gy,
            }[length],
        ) ?? error`Year not found`;
    const year = parseInt(yearString, 10);
    if (length === 4) {
        context.result.year = year;
        return;
    }
    assert(context.referenceYear !== undefined);
    context.result.year = adjustYear(context.referenceYear, year);
}

function parseMonth(context: ParseContext, length: 1 | 2 | 3 | 4) {
    if (length === 1 || length === 2) {
        const [month] =
            scanPattern(
                context,
                { 1: /1[0-2]?|[2-9]/gsy, 2: /0[1-9]|1[0-2]/gsy }[length],
            ) ?? error`Month not found`;
        context.result.monthCode = `M${month.padStart(2, '0')}`;
        return;
    }
    const type = length === 3 ? 'short' : 'long';
    const names = LOCALES[context.locale].month[type];
    for (const [monthCode, name] of Object.entries(names)) {
        if (scanLiteral(context, name)) {
            context.result.monthCode = monthCode;
            return;
        }
    }
    error(`Month not found for type ${type} in locale ${context.locale}`);
}

function parseNumber(
    context: ParseContext,
    re: RegExp,
    property: NumberProperties<WithValue>,
) {
    const [num] = scanPattern(context, re) ?? error`${property} not found`;
    context.result[property] = parseInt(num, 10);
}

function parseDayPeriod(context: ParseContext) {
    const [index] = parseWithArray(
        context,
        LOCALES[context.locale].dayPeriod.amPm,
        'day period',
    );
    context.isPm = index === 1;
}

function parseFractionalSecond(
    context: ParseContext,
    length: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
) {
    const [match] =
        scanPattern(
            context,
            {
                1: /\d/gy,
                2: /\d{1,2}/gy,
                3: /\d{1,3}/gy,
                4: /\d{1,4}/gy,
                5: /\d{1,5}/gy,
                6: /\d{1,6}/gy,
                7: /\d{1,7}/gy,
                8: /\d{1,8}/gy,
                9: /\d{1,9}/gy,
            }[length],
        ) ?? error`Fractional second not found`;
    context.result.millisecond = parseInt(match.slice(0, 3).padEnd(3, '0'), 10);
    context.result.microsecond =
        match.length > 3 ? parseInt(match.slice(3, 6).padEnd(3, '0'), 10) : 0;
    context.result.nanosecond =
        match.length > 6 ? parseInt(match.slice(6, 9).padEnd(3, '0'), 10) : 0;
}

function parseDayOfWeek(context: ParseContext, length: 1 | 2 | 3 | 4) {
    const type = length === 4 ? 'long' : 'short';
    parseWithArray(
        context,
        LOCALES[context.locale].dayOfWeek[type],
        'Day of week',
    );
    // 曜日は解析の結果には含めないので、context.resultは更新しない
}

function parseTimeZone(
    context: ParseContext,
    length: 1 | 2 | 3,
    allowZ: boolean,
) {
    if (allowZ && scanLiteral(context, 'Z')) {
        context.offset = 'UTC';
        return;
    }
    [context.offset] =
        scanPattern(
            context,
            {
                1: /[+-]\d{2}(?:\d{2})?/gy,
                2: /[+-]\d{4}/gy,
                3: /[+-]\d{2}:\d{2}/gy,
            }[length],
        ) ?? error`Time zone not found`;
}

const parseMap = {
    y: (context, length) => parseYear(context, length),
    M: (context, length) => parseMonth(context, length),
    d: (context, length) =>
        parseNumber(
            context,
            {
                1: /([12]\d?|3[01]?|[4-9])/gy,
                2: /0[1-9]|[12]\d|3[01]/gy,
            }[length],
            'day',
        ),
    H: (context, length) =>
        parseNumber(
            context,
            {
                1: /1\d?|2[0-3]?|[3-9]/gy,
                2: /0\d|1\d|2[0-3]/gy,
            }[length],
            'hour',
        ),
    h: (context, length) =>
        parseNumber(
            context,
            {
                1: /1[0-2]?|[2-9]/gy,
                2: /0[1-9]|1[0-2]/gy,
            }[length],
            'hour',
        ),
    a: context => parseDayPeriod(context),
    m: (context, length) =>
        parseNumber(
            context,
            {
                1: /0|[1-5]?\d|[6-9]/gy,
                2: /[0-5]\d/gy,
            }[length],
            'minute',
        ),
    s: (context, length) =>
        parseNumber(
            context,
            {
                1: /0|[1-5]?\d|[6-9]/gy,
                2: /[0-5]\d/gy,
            }[length],
            'second',
        ),
    S: (context, length) => parseFractionalSecond(context, length),
    E: (context, length) => parseDayOfWeek(context, length),
    X: (context, length) => parseTimeZone(context, length, true),
    x: (context, length) => parseTimeZone(context, length, false),
} as const satisfies {
    [Char in keyof FormatTokenMap]: (
        context: ParseContext,
        length: FormatTokenMap[Char]['l'][number],
    ) => void;
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
        // 日は初期値が1、それ以外は0(yearより上位のプロパティはないのでここにはyearは来ない)
        result[name] = name === 'day' ? 1 : 0;
    }
}

function parseInput(
    nodes: ParsedFormatString,
    input: string,
    locale: Locale,
    referenceYear?: number,
): ParseContext | undefined {
    const context: ParseContext = {
        input,
        index: 0,
        locale,
        result: {},
        referenceYear,
    };

    for (const node of nodes) {
        if (typeof node === 'string') {
            // リテラル文字列は文字列が一致するかどうかだけ
            if (!scanLiteral(context, node)) {
                // 文字列が一致しない場合はundefinedを返す
                return undefined;
            }
            continue;
        }

        try {
            parseMap[node[0]](context, node[1] as never);
        } catch (ex) {
            console.log(ex);
            // 解析に失敗した場合はundefinedを返す
            return undefined;
        }
    }
    if (context.index !== input.length) {
        // 解析で残った部分がある場合はundefinedを返す
        return undefined;
    }

    if (context.isPm !== undefined) {
        assert(context.result.hour !== undefined);
        // 13以上にはならないはず
        if (context.result.hour === 12) {
            if (!context.isPm) {
                // 午前12時は0時にする
                context.result.hour = 0;
            }
        } else {
            // !==12なので1〜11時
            if (context.isPm) {
                // 午後1〜11時は12時間加算する
                context.result.hour += 12;
            }
        }
    }
    // 指定されたプロパティよりも下位のプロパティをリセット
    initializeSubordinateProperties(context);
    return context;
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
 * - 書式文字列に文字列リテラルだけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
 * - 書式文字列に日時や時刻に変換されるがアルファベットが指定されていない
 * - 書式文字列に`a`(午前・午後)が指定されているのに`h`や`hh`(12時間制の時)が指定されていない
 * - 書式文字列に`h`もしくは`hh`(12時間制の時)が指定されているのに`a`(午前・午後)が指定されていない
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
    assert(isKeyOf(locale, LOCALES), `サポートしていないロケール: ${locale}`);
    assert(
        overflow === 'constrain' || overflow === 'reject',
        `サポートしていないオーバーフローの挙動: ${overflow}`,
    );
    assert(
        reference.calendarId === undefined ||
            reference.calendarId === 'iso8601',
        `対応していないカレンダーです: ${reference.calendarId}`,
    );

    // 書式文字列を解析
    const nodes = parseFormatString(formatString);
    validateProperties(nodes, reference, formatString, 'parse');

    const context = parseInput(nodes, input, locale, reference.year);
    if (!context) {
        return undefined;
    }
    let result = reference;
    // タイムゾーンの指定があればそのタイムゾーンに変更してから日付時刻を設定する
    if (context.offset !== undefined) {
        result = result.withTimeZone(context.offset);
    }
    try {
        result = result.with(context.result, { overflow });
    } catch (ex) {
        console.log(ex);
        // 解析結果が不正な場合はundefinedを返す
        return undefined;
    }
    // タイムゾーンを変更していたらreferenceのタイムゾーンに戻す
    if (context.offset !== undefined) {
        result = result.withTimeZone(reference);
    }
    return result;
}

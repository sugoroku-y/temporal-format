import type { FormatTarget } from './FormatTarget';
import type { TargetFor } from './TargetFor';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    DATE_TIME_PROPERTIES,
    LOCALES,
    ORDER_PROPERTIES,
    propertyMap,
    type DayOfWeekType,
    type Locale,
    type MonthType,
    type PropertyMap,
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
    input: string;
    index: number;
    locale: Locale;
    result: WithValue;
    isPm?: boolean;
    year?: number;
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

function validateMethod(nodes: ParsedFormatString, reference: object) {
    assert(
        'with' in reference && typeof reference.with === 'function',
        `${reference.constructor.name}にはメソッドwithがありません`,
    );
    assert(
        !nodes.some(
            node =>
                Array.isArray(node) &&
                propertyMap[node[0]].includes('offsetNanoseconds'),
        ) ||
            ('withTimeZone' in reference &&
                typeof reference.withTimeZone === 'function'),
        `${reference.constructor.name}にはメソッドwithTimeZoneがありません`,
    );
}

function validateFormatTokens(nodes: ParsedFormatString) {
    const check: { hasFormat?: true; hasAmPm?: true; hasHour12?: true } = {};
    for (const node of nodes) {
        if (typeof node === 'string') {
            continue;
        }
        const [token] = node;
        if (
            !check.hasFormat &&
            isKeyOf(token, propertyMap) &&
            propertyMap[token].some(property => property in DATE_TIME_PROPERTIES)
        ) {
            check.hasFormat = true;
        }
        if (!check.hasAmPm && token === 'a') {
            check.hasAmPm = true;
        }
        if (!check.hasHour12 && (token === 'h' || token === 'hh')) {
            check.hasHour12 = true;
        }
    }
    if (!check.hasFormat) {
        error(`日付か時刻の書式文字列がありません`);
    }
    if (check.hasAmPm && !check.hasHour12) {
        error('午前/午後(a)がある場合、12時間表記(h/hh)も必要です');
    }
    if (check.hasHour12 && !check.hasAmPm) {
        error('12時間表記(h/hh)がある場合、午前/午後(a)も必要です');
    }
}

function scanLiteral(context: ParseContext, literal: string) {
    if (!context.input.startsWith(literal, context.index)) {
        // 文字列が一致しない場合はundefinedを返す
        return false;
    }
    context.index += literal.length;
    return true;
}

function parsePattern(context: ParseContext, re: RegExp) {
    re.lastIndex = context.index;
    const match = re.exec(context.input);
    if (!match || match.index !== context.index) {
        error(`Pattern not found: ${re}`);
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

function parseYear4Digits(context: ParseContext) {
    context.result.year = parseInt(parsePattern(context, /\d{4}/g)[0], 10);
}

function parseYear2Digits(context: ParseContext) {
    const year2 = parseInt(parsePattern(context, /\d{2}/g)[0], 10);
    const thisYear = Temporal.Now.plainDateISO().year;
    // まずは同じ世紀の年として計算する
    let year = year2 + Math.floor(thisYear / 100) * 100;
    if (Math.abs(year - thisYear) > 50) {
        // 差が50年より大きければ1世紀ずらす
        // v8 ignore next -- 実行する年によって一方しか実行されないのでカバレッジの対象からは外す
        year += year > thisYear ? -100 : 100;
    }
    context.result.year = year;
}

function parseMonthName(context: ParseContext, type: MonthType) {
    const names = LOCALES[context.locale].month[type];
    for (const [monthCode, name] of Object.entries(names)) {
        if (scanLiteral(context, name)) {
            context.result.monthCode = monthCode;
            return;
        }
    }
    error(`Month not found for type ${type} in locale ${context.locale}`);
}

function parseMonthNumber(context: ParseContext, length: 1 | 2) {
    const [month] = parsePattern(
        context,
        { 1: /1[0-2]?|[2-9]/gs, 2: /0[1-9]|1[0-2]/gs }[length],
    );
    context.result.monthCode = `M${month.padStart(2, '0')}`;
}

function parseNumber(
    context: ParseContext,
    re: RegExp,
    property: NumberProperties<WithValue>,
) {
    context.result[property] = parseInt(parsePattern(context, re)[0], 10);
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
    const [match] = parsePattern(
        context,
        {
            1: /\d/g,
            2: /\d{1,2}/g,
            3: /\d{1,3}/g,
            4: /\d{1,4}/g,
            5: /\d{1,5}/g,
            6: /\d{1,6}/g,
            7: /\d{1,7}/g,
            8: /\d{1,8}/g,
            9: /\d{1,9}/g,
        }[length],
    );
    context.result.millisecond = parseInt(match.slice(0, 3).padEnd(3, '0'), 10);
    context.result.microsecond =
        match.length > 3 ? parseInt(match.slice(3, 6).padEnd(3, '0'), 10) : 0;
    context.result.nanosecond =
        match.length > 6 ? parseInt(match.slice(6, 9).padEnd(3, '0'), 10) : 0;
}

function parseDayOfWeek(context: ParseContext, type: DayOfWeekType) {
    parseWithArray(
        context,
        LOCALES[context.locale].dayOfWeek[type],
        'Day of week',
    );
    // 曜日は解析の結果には含めないので、context.resultは更新しない
}

function parseTimeZone(
    context: ParseContext,
    allowZ: boolean,
    type: 'short' | 'long' | 'full',
) {
    if (allowZ && scanLiteral(context, 'Z')) {
        context.offset = 'UTC';
        return;
    }
    [context.offset] = parsePattern(
        context,
        {
            short: /[+-]\d{2}(?:\d{2})?/g,
            long: /[+-]\d{4}/g,
            full: /[+-]\d{2}:\d{2}/g,
        }[type],
    );
}

const parseMap = {
    yyyy: context => parseYear4Digits(context),
    yy: context => parseYear2Digits(context),
    M: context => parseMonthNumber(context, 1),
    MM: context => parseMonthNumber(context, 2),
    MMM: context => parseMonthName(context, 'short'),
    MMMM: context => parseMonthName(context, 'long'),
    d: context => parseNumber(context, /([12]\d?|3[01]?|[4-9])/g, 'day'),
    dd: context => parseNumber(context, /0[1-9]|[12]\d|3[01]/g, 'day'),
    H: context => parseNumber(context, /1\d?|2[0-3]?|[3-9]/g, 'hour'),
    HH: context => parseNumber(context, /0\d|1\d|2[0-3]/g, 'hour'),
    h: context => parseNumber(context, /1[0-2]?|[2-9]/g, 'hour'),
    hh: context => parseNumber(context, /0[1-9]|1[0-2]/g, 'hour'),
    a: context => parseDayPeriod(context),
    m: context => parseNumber(context, /0|[1-5]?\d|[6-9]/g, 'minute'),
    mm: context => parseNumber(context, /[0-5]\d/g, 'minute'),
    s: context => parseNumber(context, /0|[1-5]?\d|[6-9]/g, 'second'),
    ss: context => parseNumber(context, /[0-5]\d/g, 'second'),
    S: context => parseFractionalSecond(context, 1),
    SS: context => parseFractionalSecond(context, 2),
    SSS: context => parseFractionalSecond(context, 3),
    SSSS: context => parseFractionalSecond(context, 4),
    SSSSS: context => parseFractionalSecond(context, 5),
    SSSSSS: context => parseFractionalSecond(context, 6),
    SSSSSSS: context => parseFractionalSecond(context, 7),
    SSSSSSSS: context => parseFractionalSecond(context, 8),
    SSSSSSSSS: context => parseFractionalSecond(context, 9),
    E: context => parseDayOfWeek(context, 'short'),
    EE: context => parseDayOfWeek(context, 'short'),
    EEE: context => parseDayOfWeek(context, 'short'),
    EEEE: context => parseDayOfWeek(context, 'long'),
    X: context => parseTimeZone(context, true, 'short'),
    XX: context => parseTimeZone(context, true, 'long'),
    XXX: context => parseTimeZone(context, true, 'full'),
    x: context => parseTimeZone(context, false, 'short'),
    xx: context => parseTimeZone(context, false, 'long'),
    xxx: context => parseTimeZone(context, false, 'full'),
} as const satisfies Record<keyof PropertyMap, (context: ParseContext) => void>;

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
): ParseContext | undefined {
    const context: ParseContext = {
        input,
        index: 0,
        locale,
        result: {},
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
            parseMap[node[0]](context);
        } catch {
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
        // 念の為午前13時などにも対応できるように===12ではなく>=12にしておく
        if (context.result.hour >= 12) {
            if (!context.isPm) {
                // 午前12時は0時にする
                context.result.hour -= 12;
            }
        } else {
            // <12なので0〜11時
            if (context.isPm) {
                // 午後0〜11時は12時間加算する
                context.result.hour += 12;
            }
        }
    }
    // 指定されたプロパティよりも下位のプロパティをリセット
    initializeSubordinateProperties(context);
    return context;
}

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
 * @param input 解析する文字列
 * @param formatString 文字列から変換するための[書式文字列](../_media/format-strings.md)
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
export function parse<F extends string, T extends TargetFor<F>>(
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
    reference: FormatTarget,
    { locale = 'en-US', overflow = 'reject' }: ParseOptions = {},
): FormatTarget | undefined {
    assert(isKeyOf(locale, LOCALES), `サポートしていないロケール: ${locale}`);
    assert(
        overflow === 'constrain' || overflow === 'reject',
        `サポートしていないオーバーフローの挙動: ${overflow}`,
    );

    // 書式文字列を解析
    const nodes = parseFormatString(formatString);
    try {
    
        // 書式文字列の不足がないかチェック
        validateFormatTokens(nodes);
        // 書式文字列からreferenceをチェック
        validateProperties(nodes, reference);
        validateMethod(nodes, reference);
    } catch (ex) {
        assert(ex instanceof Error);
        error(`${ex.message}: ${formatString}`);
    }

    const context = parseInput(nodes, input, locale);
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
    } catch {
        // 解析結果が不正な場合はundefinedを返す
        return undefined;
    }
    // タイムゾーンを変更していたらreferenceのタイムゾーンに戻す
    if (context.offset !== undefined) {
        result = result.withTimeZone(reference);
    }
    return result;
}

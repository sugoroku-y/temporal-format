import type { FormatTarget } from './FormatTarget';
import type { TargetFor } from './TargetFor';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    DATE_TIME_PROPERTIES,
    LOCALES,
    propertyMap,
    type DayOfWeekType,
    type Locale,
    type MonthType,
    type PropertyMap,
} from './constants';
import { error } from './error';
import { isKeyOf } from './isKeyOf';
import { offsetToString } from './offsetToString';
import {
    parseFormatString,
    type ParsedFormatString,
} from './parseFormatString';
import type { NumberProperties } from './types';

type ParseResult = {
    year?: number;
    monthCode?: string;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
    microsecond?: number;
    nanosecond?: number;
    dayOfWeek?: number;
    meridiem?: number;
};

interface ParseContext {
    input: string;
    index: number;
    locale: Locale;
    result: ParseResult;
    isPm?: boolean;
    offsetNanoSeconds?: number;
}

interface ParseOptions {
    locale?: Locale;
    overflow?: 'constrain' | 'reject';
}
function validateFormatTokens(
    tokens: ParsedFormatString,
    formatString: string,
) {
    const check: { hasFormat?: true; hasAmPm?: true; hasHour12?: true } = {};
    for (const token of tokens) {
        if (typeof token === 'string') {
            continue;
        }
        if (
            isKeyOf(token[0], propertyMap) &&
            propertyMap[token[0]] in DATE_TIME_PROPERTIES
        ) {
            check.hasFormat = true;
        }
        switch (token[0]) {
            case 'a':
                check.hasAmPm = true;
                break;
            case 'h':
            case 'hh':
                check.hasHour12 = true;
                break;
        }
    }
    if (!check.hasFormat) {
        error(`日付か時刻の書式文字列がありません: ${formatString}`);
    }
    if (check.hasAmPm && !check.hasHour12) {
        error('午前/午後(a)がある場合、12時間表記(h/hh)も必要です');
    }
    if (check.hasHour12 && !check.hasAmPm) {
        error('12時間表記(h/hh)がある場合、午前/午後(a)も必要です');
    }
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
        if (context.input.startsWith(name, context.index)) {
            context.index += name.length;
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

function parseMonth(context: ParseContext, type: MonthType) {
    const names = LOCALES[context.locale].month[type];
    for (const [monthCode, name] of Object.entries(names)) {
        if (context.input.startsWith(name, context.index)) {
            context.index += name.length;
            context.result.monthCode = monthCode;
            return;
        }
    }
    error(`Month not found for type ${type} in locale ${context.locale}`);
}

function parseNumber(
    context: ParseContext,
    re: RegExp,
    property: NumberProperties<ParseResult>,
) {
    context.result[property] = parseInt(parsePattern(context, re)[0], 10);
}

function parseDaypart(context: ParseContext) {
    const [index] = parseWithArray(
        context,
        LOCALES[context.locale].daypart.amPm,
        'Daypart',
    );
    context.isPm = index === 1;
}

function parseFractionalSecond(context: ParseContext, digits: 1 | 2 | 3) {
    const { re, base } = {
        1: { re: /\d/g, base: 100 },
        2: { re: /\d{2}/g, base: 10 },
        3: { re: /\d{3}/g, base: 1 },
    }[digits];
    parseNumber(context, re, 'millisecond');
    assert(context.result.millisecond !== undefined);
    context.result.millisecond *= base;
}

function parseFractionalSecond9Digits(context: ParseContext) {
    const [match] = parsePattern(context, /\d{9}/g);
    context.result.millisecond = parseInt(match.slice(0, 3), 10);
    context.result.microsecond = parseInt(match.slice(3, 6), 10);
    context.result.nanosecond = parseInt(match.slice(6, 9), 10);
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
    if (allowZ && context.input.startsWith('Z', context.index)) {
        context.index += 1;
        context.offsetNanoSeconds = 0;
        return;
    }
    const match = parsePattern(
        context,
        {
            short: /([+-])(\d{2})(\d{2})?/g,
            long: /([+-])(\d{2})(\d{2})/g,
            full: /([+-])(\d{2}):(\d{2})/g,
        }[type],
    );
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] ?? '0', 10);
    context.offsetNanoSeconds = sign * (hours * 60 + minutes) * 60_000_000_000;
}

const parseMap = {
    yyyy: context => parseYear4Digits(context),
    yy: context => parseYear2Digits(context),
    M: context => parseMonth(context, 'numeric'),
    MM: context => parseMonth(context, 'two_digits'),
    MMM: context => parseMonth(context, 'short'),
    MMMM: context => parseMonth(context, 'long'),
    d: context => parseNumber(context, /([12]\d?|3[01]?|[4-9])/g, 'day'),
    dd: context => parseNumber(context, /0[1-9]|[12]\d|3[01]/g, 'day'),
    H: context => parseNumber(context, /1\d?|2[0-3]?|[3-9]/g, 'hour'),
    HH: context => parseNumber(context, /0\d|1\d|2[0-3]/g, 'hour'),
    h: context => parseNumber(context, /1[0-2]?|[2-9]/g, 'hour'),
    hh: context => parseNumber(context, /0[1-9]|1[0-2]/g, 'hour'),
    a: context => parseDaypart(context),
    m: context => parseNumber(context, /0|[1-5]?\d|[6-9]/g, 'minute'),
    mm: context => parseNumber(context, /[0-5]\d/g, 'minute'),
    s: context => parseNumber(context, /0|[1-5]?\d|[6-9]/g, 'second'),
    ss: context => parseNumber(context, /[0-5]\d/g, 'second'),
    S: context => parseFractionalSecond(context, 1),
    SS: context => parseFractionalSecond(context, 2),
    SSS: context => parseFractionalSecond(context, 3),
    SSSS: context => parseFractionalSecond9Digits(context),
    E: context => parseDayOfWeek(context, 'short'),
    EEE: context => parseDayOfWeek(context, 'short'),
    EEEE: context => parseDayOfWeek(context, 'long'),
    X: context => parseTimeZone(context, true, 'short'),
    XX: context => parseTimeZone(context, true, 'long'),
    XXX: context => parseTimeZone(context, true, 'full'),
    x: context => parseTimeZone(context, false, 'short'),
    xx: context => parseTimeZone(context, false, 'long'),
    xxx: context => parseTimeZone(context, false, 'full'),
} as const satisfies Record<keyof PropertyMap, (context: ParseContext) => void>;

function initializeSubordinateProperties(context: ParseContext) {
    let found = false;
    for (const name of [
        'year',
        'monthCode',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
        'microsecond',
        'nanosecond',
    ] as const) {
        if (name in context.result) {
            found ||= true;
            continue;
        }
        if (!found) {
            continue;
        }
        if (name === 'monthCode') {
            context.result.monthCode = 'M01';
            continue;
        }
        context.result[name] = name === 'day' ? 1 : 0;
    }
}

function parseInput(
    tokens: ParsedFormatString,
    input: string,
    locale: Locale,
): ParseContext | undefined {
    const context: ParseContext = {
        input,
        index: 0,
        locale,
        result: {},
    };

    for (const token of tokens) {
        if (typeof token === 'string') {
            if (!input.startsWith(token, context.index)) {
                // 文字列が一致しない場合はundefinedを返す
                return undefined;
            }
            context.index += token.length;
            continue;
        }

        try {
            parseMap[token[0]](context);
        } catch {
            // 解析に失敗した場合はundefinedを返す
            return undefined;
        }
    }
    if (context.index !== input.length) {
        // 解析で残った部分がある場合はundefinedを返す
        return undefined;
    }

    if (context.result.hour !== undefined && context.isPm !== undefined) {
        if (context.result.hour === 12) {
            if (!context.isPm) {
                // 午前12時は0時にする
                context.result.hour = 0;
            }
        } else if (context.isPm) {
            // 午後1時以降は12時間加算する
            context.result.hour += 12;
        }
    }
    initializeSubordinateProperties(context);
    return context;
}

/**
 * 指定された書式文字列に従って、文字列を日付時刻に変換します。
 *
 * 各書式文字列の内容は `format` 関数のドキュメントを参照してください。
 *
 * `input`が書式文字列に従っていない場合はundefinedを返します。
 *
 * `E`や`EEEE`は曜日の表記になりますが、解析の際には無視されます。例えば、2023/01/01は日曜日ですが、`'2023-01-01 (Mon)'` は書式文字列 `'yyyy-MM-dd (EEE)'` に従っているため、解析結果は`undefined`にはならず`2023/1/1`となります。
 * 
 * 日時や時刻に変換される書式文字列が指定されていないと、つまり曜日やタイムゾーンの書式文字列だけだとエラーになります。
 * 
 * また`a`(午前・午後)と`h`や`hh`(12時間制の時)はセットで使用していないとエラーになります。
 * @param input 解析する文字列
 * @param formatString 文字列に変換するための書式文字列
 * @param reference 解析の基準となる日付時刻。
 * @param options 解析時のオプション
 * @param options.locale ロケール。省略した場合は'en-US'が使用されます。
 * - 'en-US': 英語(アメリカ合衆国)
 * - 'ja-JP': 日本語(日本)
 * - その他のロケールは未対応のため、指定するとエラーになります。
 * @param options.overflow 日付や時刻の上限を超えた場合の処理を指定します。
 * - `constrain` 範囲内に収まる値に補正
 * - `reject` 日付データとして受け付けない(`undefined`を返す)
 * @param _ 書式文字列の検査のための引数。この引数を指定する必要はありません。
 * @returns 書式に従って文字列から変換されたTemporalのインスタンス
 * 
 * 書式でタイムゾーンを指定していても、referenceと同じタイムゾーンになります。
 * @throws 以下の場合に例外が投げられます
 * - 書式文字列に10文字以上の連続したアルファベットを指定した
 * - 書式文字列に文字列リテラルだけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
 * - 書式文字列に日時や時刻に変換されるがアルファベットが指定されていない
 * - 書式文字列に`a`(午前・午後)が指定されているのに`h`や`hh`(12時間制の時)が指定されていない
 * - 書式文字列に`h`もしくは`hh`(12時間制の時)が指定されているのに`a`(午前・午後)が指定されていない
 * - 未対応のロケールを指定した
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
    options?: ParseOptions,
): FormatTarget | undefined {
    const { locale = 'en-US', overflow } = options ?? {};
    if (locale !== 'en-US' && locale !== 'ja-JP') {
        error(`Unsupported locale: ${locale}`);
    }

    const tokens = parseFormatString(formatString);

    validateFormatTokens(tokens, formatString);

    const context = parseInput(tokens, input, locale);
    if (!context) {
        return undefined;
    }
    let result = reference;
    // タイムゾーンの指定があればそのタイムゾーンに変更してから日付時刻を設定する
    if (context.offsetNanoSeconds !== undefined) {
        // タイムゾーンが指定されているならreferenceもresultもZonedDateTime
        assert('withTimeZone' in result);
        result = result.withTimeZone(
            offsetToString(context.offsetNanoSeconds, 'full'),
        );
    }
    try {
        result = result.with(context.result, { overflow });
    } catch {
        // 解析結果が不正な場合はundefinedを返す
        return undefined;
    }
    // タイムゾーンを変更していたらreferenceのタイムゾーンに戻す
    if (context.offsetNanoSeconds !== undefined) {
        // タイムゾーンが指定されているならreferenceもresultもZonedDateTime
        assert('withTimeZone' in result);
        assert('withTimeZone' in reference);
        result = result.withTimeZone(reference);
    }
    return result;
}

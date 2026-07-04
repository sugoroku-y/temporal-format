import type { FormatTarget } from './FormatTarget';
import type { TargetFor } from './TargetFor';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    type DayOfWeekType,
    FORMAT_TOKEN_MAP,
    type FormatTokenMap,
    type Locale,
    LOCALES,
    type MonthType,
} from './constants';
import { isKeyOf } from './isKeyOf';
import { padNumber } from './padNumber';
import { parseFormatString } from './parseFormatString';
import type { EnableAccessingNonProperty } from './types';
import { validateProperties } from './validateProperties';

function formatMonthNumber(monthCode: string, length: 1 | 2): string {
    return monthCode.replace({ 1: /\D0?/g, 2: /\D/g }[length], '');
}

function formatMonthName(
    monthCode: string,
    locale: Locale,
    monthType: MonthType,
): string {
    const table = LOCALES[locale].month[monthType];
    return isKeyOf(monthCode, table) ? table[monthCode] : monthCode;
}

function formatDayOfWeek(
    dayOfWeek: number,
    locale: Locale,
    dayOfWeekType: DayOfWeekType,
): string {
    return LOCALES[locale].dayOfWeek[dayOfWeekType][dayOfWeek - 1];
}

function formatFractionalSecond(
    {
        millisecond,
        microsecond,
        nanosecond,
    }: { millisecond: number; microsecond: number; nanosecond: number },
    length: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
): string {
    return `${padNumber(millisecond, 3)}${length > 3 ? padNumber(microsecond, 3) : ''}${length > 6 ? padNumber(nanosecond, 3) : ''}`.slice(
        0,
        length,
    );
}

function formatOffset(
    offset: string,
    length: 1 | 2 | 3,
    allowZ?: true,
): string {
    if (allowZ && offset === '+00:00') {
        return 'Z';
    }
    return offset.replace(
        {
            1: /:(?:00)?/,
            2: /:/,
            3: /^/,
        }[length],
        '',
    );
}

function formatNumberValue(value: number, length: 1 | 2) {
    return {
        1: (d: number) => String(d),
        2: (d: number) => padNumber(d),
    }[length](value);
}

const formatMap = {
    y: ({ year }, length) =>
        ({
            2: (y: number) => padNumber(y % 100),
            4: (y: number) => String(y),
        })[length](year),
    M: ({ monthCode }, length, { locale }) =>
        ({
            1: (m: string) => formatMonthNumber(m, 1),
            2: (m: string) => formatMonthNumber(m, 2),
            3: (m: string, l: Locale) => formatMonthName(m, l, 'short'),
            4: (m: string, l: Locale) => formatMonthName(m, l, 'long'),
        })[length](monthCode, locale),
    d: ({ day }, length) => formatNumberValue(day, length),
    H: ({ hour }, length) => formatNumberValue(hour, length),
    h: ({ hour }, length) => formatNumberValue(((hour + 11) % 12) + 1, length),
    a: ({ hour }, _, { locale }) =>
        LOCALES[locale].dayPeriod.amPm[Math.floor(hour / 12)],
    m: ({ minute }, length) => formatNumberValue(minute, length),
    s: ({ second }, length) => formatNumberValue(second, length),
    S: (d, length) => formatFractionalSecond(d, length),
    E: ({ dayOfWeek }, length, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, length === 4 ? 'long' : 'short'),
    X: ({ offset }, length) => formatOffset(offset, length, true),
    x: ({ offset }, length) => formatOffset(offset, length),
} as const satisfies {
    [K in keyof typeof FORMAT_TOKEN_MAP]: (
        target: Extract<
            FormatTarget,
            Record<FormatTokenMap[K]['p'][number], unknown>
        >,
        length: FormatTokenMap[K]['l'][number],
        options: { locale: Locale },
    ) => string;
};

/**
 * 整形のためのオプション
 */
export interface FormatOptions {
    /** 整形時に使用するロケール {@link Locale} */
    locale?: Locale;
}

/**
 * 指定された書式文字列にしたがって、日付時刻を文字列に変換します。
 *
 * 書式文字列は `target` のプロパティの内容に基づいて変換されます。
 * @template F 書式文字列の型
 * @param target 文字列に変換する日付時刻。
 *
 * 書式文字列で指定された書式指定子に必要とされるプロパティを持つ必要があります。
 * @param formatString 文字列に変換するための{@link FormatString 書式文字列}
 * @param options 整形時に使用するオプション
 * @returns 書式にしたがって変換された文字列
 * @throws 以下の場合に例外が投げられます
 *
 * - 書式文字列にリテラル文字列だけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で単独の引用符を使用した
 * - 書式文字列で無効な書式指定子を使用した
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
 * - カレンダーがISO8601ではないインスタンスを指定した
 * - 未対応のロケールを指定した
 */
export function format<F extends string>(
    target: TargetFor<F>,
    formatString: F,
    options?: FormatOptions,
    ..._: ValidateFormatString<F, 'format'>
): string;

// format関数の実装
export function format(
    target: EnableAccessingNonProperty<FormatTarget>,
    formatString: string,
    { locale = 'en-US' }: FormatOptions = {},
): string {
    assert(isKeyOf(locale, LOCALES), `サポートしていないロケール: ${locale}`);
    assert(
        target.calendarId === undefined || target.calendarId === 'iso8601',
        `対応していないカレンダーです: ${target.calendarId}`,
    );
    const options = { locale } satisfies { locale: Locale };
    const nodes = parseFormatString(formatString);
    validateProperties(nodes, target, formatString, 'format');
    const result: string[] = [];
    for (const node of nodes) {
        if (typeof node === 'string') {
            result.push(node);
            continue;
        }
        const [char, length] = node;
        const f = formatMap[char] as (
            t: typeof target,
            l: typeof length,
            o: typeof options,
        ) => string;
        result.push(f(target, length, options));
    }
    return result.join('');
}

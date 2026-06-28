import type { FormatTarget } from './FormatTarget';
import type { TargetFor } from './TargetFor';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    type DayOfWeekType,
    type Locale,
    LOCALES,
    type MonthType,
    type PropertyMap,
    type propertyMap,
} from './constants';
import { isKeyOf } from './isKeyOf';
import { padNumber } from './padNumber';
import { parseFormatString } from './parseFormatString';
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
    offsetNanoseconds: number,
    type: 'short' | 'long' | 'full',
    allowZ?: true,
): string {
    if (allowZ && offsetNanoseconds === 0) {
        return 'Z';
    }
    const sign = offsetNanoseconds < 0 ? '-' : '+';
    const absOffset = Math.abs(Math.floor(offsetNanoseconds / 6e10));
    const hours = padNumber(Math.floor(absOffset / 60));
    const minutes = absOffset % 60;
    if (type === 'short' && minutes === 0) {
        return `${sign}${hours}`;
    }
    return `${sign}${hours}${type === 'full' ? ':' : ''}${padNumber(minutes)}`;
}

const formatMap = {
    yy: ({ year }) => padNumber(year % 100),
    yyyy: ({ year }) => String(year),
    M: ({ monthCode }) => formatMonthNumber(monthCode, 1),
    MM: ({ monthCode }) => formatMonthNumber(monthCode, 2),
    MMM: ({ monthCode }, { locale }) =>
        formatMonthName(monthCode, locale, 'short'),
    MMMM: ({ monthCode }, { locale }) =>
        formatMonthName(monthCode, locale, 'long'),
    d: ({ day }) => String(day),
    dd: ({ day }) => padNumber(day),
    H: ({ hour }) => String(hour),
    HH: ({ hour }) => padNumber(hour),
    h: ({ hour }) => String(((hour + 11) % 12) + 1),
    hh: ({ hour }) => padNumber(((hour + 11) % 12) + 1),
    a: ({ hour }, { locale }) =>
        LOCALES[locale].dayPeriod.amPm[Math.floor(hour / 12)],
    m: ({ minute }) => String(minute),
    mm: ({ minute }) => padNumber(minute),
    s: ({ second }) => String(second),
    ss: ({ second }) => padNumber(second),
    S: d => formatFractionalSecond(d, 1),
    SS: d => formatFractionalSecond(d, 2),
    SSS: d => formatFractionalSecond(d, 3),
    SSSS: d => formatFractionalSecond(d, 4),
    SSSSS: d => formatFractionalSecond(d, 5),
    SSSSSS: d => formatFractionalSecond(d, 6),
    SSSSSSS: d => formatFractionalSecond(d, 7),
    SSSSSSSS: d => formatFractionalSecond(d, 8),
    SSSSSSSSS: d => formatFractionalSecond(d, 9),
    E: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'short'),
    EEE: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'short'),
    EE: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'short'),
    EEEE: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'long'),
    X: ({ offsetNanoseconds }) =>
        formatOffset(offsetNanoseconds, 'short', true),
    XX: ({ offsetNanoseconds }) =>
        formatOffset(offsetNanoseconds, 'long', true),
    XXX: ({ offsetNanoseconds }) =>
        formatOffset(offsetNanoseconds, 'full', true),
    x: ({ offsetNanoseconds }) => formatOffset(offsetNanoseconds, 'short'),
    xx: ({ offsetNanoseconds }) => formatOffset(offsetNanoseconds, 'long'),
    xxx: ({ offsetNanoseconds }) => formatOffset(offsetNanoseconds, 'full'),
} as const satisfies {
    [K in keyof PropertyMap]: (
        target: Extract<FormatTarget, Record<(typeof propertyMap)[K][number], unknown>>,
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
 * @template FormatString 書式文字列の型
 * @param target 文字列に変換する日付時刻。
 *
 * 書式文字列で指定された書式指定子に必要とされるプロパティを持つ必要があります。
 * @param formatString 文字列に変換するための{@link propertyMap 書式文字列}
 * @param options 整形時に使用するオプション
 * @returns 書式にしたがって変換された文字列
 * @throws 以下の場合に例外が投げられます
 *
 * - 書式文字列にリテラル文字列だけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で単独の引用符を使用した
 * - 書式文字列で無効な書式指定子を使用した
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
 * -
 * - 未対応のロケールを指定した
 */
export function format<FormatString extends string>(
    target: TargetFor<FormatString>,
    formatString: FormatString,
    options?: FormatOptions,
    ..._: ValidateFormatString<FormatString, 'format'>
): string;

// format関数の実装
export function format(
    target: FormatTarget,
    formatString: string,
    { locale = 'en-US' }: FormatOptions = {},
): string {
    assert(isKeyOf(locale, LOCALES), `サポートしていないロケール: ${locale}`);
    const options = { locale } satisfies { locale: Locale };
    const nodes = parseFormatString(formatString);
    validateProperties(nodes, target);
    return nodes
        .map(node =>
            typeof node === 'string'
                ? node
                : formatMap[node[0]](target, options),
        )
        .join('');
}

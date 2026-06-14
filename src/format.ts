import type { FormatTarget } from './FormatTarget';
import type { TargetFor } from './TargetFor';
import type { ValidateFormatString } from './ValidateFormatString';
import {
    type DayOfWeekType,
    type Locale,
    LOCALES,
    type MonthType,
    propertyMap,
    type PropertyMap,
} from './constants';
import { error } from './error';
import { isKeyOf } from './isKeyOf';
import { offsetToString } from './offsetToString';
import { padNumber } from './padNumber';
import { parseFormatString } from './parseFormatString';

function formatMonth(
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

const formatMap = {
    yy: ({ year }) => padNumber(year % 100),
    yyyy: ({ year }) => String(year),
    M: ({ monthCode }, { locale }) => formatMonth(monthCode, locale, 'numeric'),
    MM: ({ monthCode }, { locale }) =>
        formatMonth(monthCode, locale, 'two_digits'),
    MMM: ({ monthCode }, { locale }) => formatMonth(monthCode, locale, 'short'),
    MMMM: ({ monthCode }, { locale }) => formatMonth(monthCode, locale, 'long'),
    d: ({ day }) => String(day),
    dd: ({ day }) => padNumber(day, 2),
    H: ({ hour }) => String(hour),
    HH: ({ hour }) => padNumber(hour, 2),
    h: ({ hour }) => String(hour % 12 || 12),
    hh: ({ hour }) => padNumber(hour % 12 || 12, 2),
    a: ({ hour }, { locale }) =>
        LOCALES[locale].daypart.amPm[hour < 12 ? 0 : 1],
    m: ({ minute }) => String(minute),
    mm: ({ minute }) => padNumber(minute, 2),
    s: ({ second }) => String(second),
    ss: ({ second }) => padNumber(second, 2),
    S: ({ millisecond }) => padNumber(millisecond, 3).slice(0, 1),
    SS: ({ millisecond }) => padNumber(millisecond, 3).slice(0, 2),
    SSS: ({ millisecond }) => padNumber(millisecond, 3),
    SSSS: ({ millisecond, microsecond, nanosecond }) =>
        `${padNumber(millisecond, 3)}${
            //
            padNumber(microsecond, 3)
        }${padNumber(nanosecond, 3)}`,

    E: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'short'),
    EEE: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'short'),
    EEEE: ({ dayOfWeek }, { locale }) =>
        formatDayOfWeek(dayOfWeek, locale, 'long'),
    X: ({ offsetNanoseconds }) =>
        offsetNanoseconds === 0
            ? 'Z'
            : offsetToString(offsetNanoseconds, 'short'),
    XX: ({ offsetNanoseconds }) =>
        offsetNanoseconds === 0
            ? 'Z'
            : offsetToString(offsetNanoseconds, 'long'),
    XXX: ({ offsetNanoseconds }) =>
        offsetNanoseconds === 0
            ? 'Z'
            : offsetToString(offsetNanoseconds, 'full'),
    x: ({ offsetNanoseconds }) => offsetToString(offsetNanoseconds, 'short'),
    xx: ({ offsetNanoseconds }) => offsetToString(offsetNanoseconds, 'long'),
    xxx: ({ offsetNanoseconds }) => offsetToString(offsetNanoseconds, 'full'),
} as const satisfies {
    [K in keyof PropertyMap]: (
        target: Extract<FormatTarget, Record<PropertyMap[K], unknown>>,
        options: { locale: Locale },
    ) => string;
};

/**
 * 指定された書式文字列に従って、日付時刻を文字列に変換します。
 *
 * 各書式文字列は `target` のプロパティの内容に基づいて変換されます。
 *
 * | トークン | プロパティ| 例 | 説明 |
 * | --- | :---| --- | --- |
 * | `yyyy` | `year` | `2026` | 4 桁の西暦 |
 * | `yy` | `year` | `26` | 下2桁の西暦 |
 * | `M` | `month` | `8` | 桁揃えなしの月 |
 * | `MM` | `month` | `08` | 2 桁の月 |
 * | `MMM` | `month` | `Aug` | 月の英語略称 |
 * | `MMMM` | `month` | `August` | 月の英語表記 |
 * | `d` | `day` | `9` | 桁揃えなしの日 |
 * | `dd` | `day` | `09` | 2 桁の日 |
 * | `H` | `hour` | `21` | 24時間表記の時間 |
 * | `HH` | `hour` | `21` | 2 桁の 24 時間表記の時間 |
 * | `h` | `hour` | `9` | 12時間表記の時間 |
 * | `hh` | `hour` | `09` | 2 桁の 12 時間表記の時間 |
 * | `a` | `hour` | `PM` | 午前/午後 |
 * | `m` | `minute` | `3` | 桁揃えなしの分 |
 * | `mm` | `minute` | `03` | 2 桁の分 |
 * | `s` | `second` | `5` | 桁揃えなしの秒 |
 * | `ss` | `second` | `05` | 2 桁の秒 |
 * | `S` | `millisecond` | `1` | 1 桁のミリ秒 |
 * | `SS` | `millisecond` | `12` | 2 桁のミリ秒 |
 * | `SSS` | `millisecond` | `123` | 3 桁のミリ秒 |
 * | `SSSS` | `millisecond`<br>`microsecond`<br>`nanosecond` | `123456789` | 9 桁のミリ秒 |
 * | `E`| `dayOfWeek` | `Thu` | 曜日の英語略称 |
 * | `EEE` | `dayOfWeek` | `Thu` | 曜日の英語略称 |
 * | `EEEE` | `dayOfWeek` | `Thursday` | 曜日の英語表記 |
 *
 * 将来の拡張のため、同じアルファベットが1文字から4文字連続しているものは予約されており、
 * 上記の表にないものが使用されるとエラーになります。
 *
 * アルファベットを単なる文字列として使用したい場合は、シングルクォートで囲む必要があります。
 * 例えば、`'T'` は文字列 "T" を表し、予約されたトークンではありません。
 *
 * シングルクォートを文字列として使用したい場合は、2 つ連続してシングルクォートを使用する必要があります。
 * 例えば、`''` は "'" 1文字に変換されます。
 *
 * クォートされた文字列の中で、シングルクオートを使いたい場合にも、2 つ連続してシングルクォートを使用する必要があります。
 * 例えば、`'o''clock'` は文字列 "o'clock" に変換されます。
 *
 * 日付や時刻に変換される書式文字列が一つもないとエラーになります。
 *
 * @param formatString 文字列に変換するための書式文字列
 * @param target 文字列に変換する日付時刻。
 * @param options オプション
 * @param options.locale ロケール。省略した場合は'en-US'が使用されます。
 * - 'en-US': 英語(アメリカ合衆国)
 * - 'ja-JP': 日本語(日本) \
 *   EやEEEEは木や金曜日の表記になります。\
 *   aは午前/午後の表記になります。
 * - その他のロケールは未対応のため、指定するとエラーになります。
 * @param _ 書式文字列の検査のための引数。この引数を指定する必要はありません。
 */
export function format<F extends string>(
    target: TargetFor<F>,
    formatString: F,
    options?: { locale?: string },
    ..._: ValidateFormatString<F, 'format'>
): string;

// format関数の実装
export function format(
    target: FormatTarget,
    formatString: string,
    options?: { locale?: string },
    ..._: unknown[]
): string {
    const { locale = 'en-US' } = options ?? {};
    if (!isKeyOf(locale, LOCALES)) {
        error(`ロケール${locale}はサポートされていません`);
    }
    const strictOptions = { locale } satisfies { locale: Locale };
    const tokens = parseFormatString(formatString);
    return tokens
        .map(token =>
            typeof token === 'string'
                ? token
                : isKeyOf(token[0], propertyMap) &&
                    propertyMap[token[0]] in target
                  ? formatMap[token[0]](
                        // targetはプロパティ確認済みなので型チェックをパスする
                        target as never,
                        strictOptions,
                    )
                  : error`${target.constructor.name}にプロパティ${propertyMap[token[0]]}がありません: ${token[0]} `,
        )
        .join('');
}

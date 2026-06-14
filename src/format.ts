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

interface FormatOptions {
    locale?: Locale;
}

/**
 * 指定された書式文字列に従って、日付時刻を文字列に変換します。
 *
 * 各書式文字列は `target` のプロパティの内容に基づいて変換されます。
 *
 * | トークン | プロパティ| 例 | 説明 |
 * | --- | :---| --- | --- |
 * | `yyyy` | `year` | `2026` | 4 桁の西暦 |
 * | `yy` | `year` | `26` | 下2桁の西暦 |
 * | `M` | `month` | `8`, `12` | 桁揃えなしの月 |
 * | `MM` | `month` | `08`, `12` | 2 桁の月 |
 * | `MMM` | `month` | `Aug`, `Dec` | 月の英語略称 |
 * | `MMMM` | `month` | `August`, `December` | 月の英語表記 |
 * | `d` | `day` | `9`, `28` | 桁揃えなしの日 |
 * | `dd` | `day` | `09`, `28` | 2 桁の日 |
 * | `H` | `hour` | `02`, `21` | 24時間表記の時間 |
 * | `HH` | `hour` | `02`, `21` | 2 桁の 24 時間表記の時間 |
 * | `h` | `hour` | `9`, `12` | 12時間表記の時間 |
 * | `hh` | `hour` | `09`, `12` | 2 桁の 12 時間表記の時間 |
 * | `a` | `hour` | `AM`, `PM` | 午前/午後 |
 * | `m` | `minute` | `3`, `56` | 桁揃えなしの分 |
 * | `mm` | `minute` | `03`, `56` | 2 桁の分 |
 * | `s` | `second` | `5`, `48` | 桁揃えなしの秒 |
 * | `ss` | `second` | `05`, `48` | 2 桁の秒 |
 * | `S`, `SS`, `SSS`, ...`SSSSSSSSS` | `millisecond`, `microsecond`, `nanosecond` | `1`, `12`, `123`, ...`123456789` | 1桁〜9桁の小数点以下の秒 |
 * | `E`, `EE`, `EEE`| `dayOfWeek` | `Mon`, `Thu` | 曜日の英語略称 |
 * | `EEEE` | `dayOfWeek` | `Monday`, `Thursday` | 曜日の英語表記 |
 *
 * 将来の拡張のため、同じアルファベットが1文字から9文字連続しているものは予約されており、
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
 * 閉じられていないシングルクォートがあるとエラーになります。
 *
 * 日付や時刻に変換される書式文字列が一つもないとエラーになります。
 *
 * @param target 文字列に変換する日付時刻。
 * @param formatString 文字列に変換するための書式文字列
 * @param options オプション
 * @param options.locale ロケール。省略した場合は'en-US'が使用されます。
 * - `en-US`: 英語(アメリカ合衆国)
 * - `ja-JP`: 日本語(日本)
 *   |書式|結果|
 *   |-|-|
 *   |`MMM`, `MMMM`|`1月`〜`12月`|
 *   |`E`, `EE`, `EEE`|`月`〜`日`|
 *   |`EEEE`| `月曜日`〜`日曜日`|
 *   |`a`|`午前`, `午後`|
 * - その他のロケールは未対応のため、指定するとエラーになります。
 * @param _ 書式文字列の検査のための引数。この引数を指定する必要はありません。
 * @returns 書式に従って変換された文字列
 * @throws 以下の場合に例外が投げられます
 * - 書式文字列に10文字以上の連続したアルファベットを指定した
 * - 書式文字列に文字列リテラルだけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
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
    target: FormatTarget,
    formatString: string,
    { locale = 'en-US' }: FormatOptions = {},
    ..._: unknown[]
): string {
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

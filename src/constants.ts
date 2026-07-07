import type { FormatTarget } from './FormatTarget';
import type { TokenNode } from './parseFormatString';
import type { AllPropertyNames, Alphabet } from './types';

export const FORMAT_TOKEN_MAP = {
    y: { length: [2, 4], properties: ['year'] },
    M: { length: [1, 2, 3, 4], properties: ['monthCode'] },
    d: { length: [1, 2], properties: ['day'] },
    E: { length: [1, 2, 3, 4], properties: ['dayOfWeek'] },
    a: { length: [1], properties: ['hour'] },
    H: { length: [1, 2], properties: ['hour'] },
    h: { length: [1, 2], properties: ['hour'] },
    m: { length: [1, 2], properties: ['minute'] },
    s: { length: [1, 2], properties: ['second'] },
    S: {
        length: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        properties: ['millisecond', 'microsecond', 'nanosecond'],
    },
    X: { length: [1, 2, 3], properties: ['offset'] },
    x: { length: [1, 2, 3], properties: ['offset'] },
} as const satisfies Partial<
    Record<
        Alphabet,
        { length: number[]; properties: AllPropertyNames<FormatTarget>[] }
    >
>;

export type FormatTokenMap = typeof FORMAT_TOKEN_MAP;
export type StrictTokenNode = {
    [Char in keyof FormatTokenMap]: TokenNode<
        Char,
        FormatTokenMap[Char]['length'][number]
    >;
}[keyof FormatTokenMap];
export type IsSupportedToken<Token extends TokenNode> =
    Token extends StrictTokenNode ? true : false;

export const LOCALES = {
    'en-US': {
        month: {
            short: {
                M01: 'Jan',
                M02: 'Feb',
                M03: 'Mar',
                M04: 'Apr',
                M05: 'May',
                M06: 'Jun',
                M07: 'Jul',
                M08: 'Aug',
                M09: 'Sep',
                M10: 'Oct',
                M11: 'Nov',
                M12: 'Dec',
            },
            long: {
                M01: 'January',
                M02: 'February',
                M03: 'March',
                M04: 'April',
                M05: 'May',
                M06: 'June',
                M07: 'July',
                M08: 'August',
                M09: 'September',
                M10: 'October',
                M11: 'November',
                M12: 'December',
            },
        },
        dayOfWeek: {
            short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            long: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ],
        },
        dayPeriod: {
            amPm: ['AM', 'PM'],
        },
    },
    'ja-JP': {
        month: {
            short: {
                M01: '1月',
                M02: '2月',
                M03: '3月',
                M04: '4月',
                M05: '5月',
                M06: '6月',
                M07: '7月',
                M08: '8月',
                M09: '9月',
                M10: '10月',
                M11: '11月',
                M12: '12月',
            },
            long: {
                M01: '1月',
                M02: '2月',
                M03: '3月',
                M04: '4月',
                M05: '5月',
                M06: '6月',
                M07: '7月',
                M08: '8月',
                M09: '9月',
                M10: '10月',
                M11: '11月',
                M12: '12月',
            },
        },
        dayOfWeek: {
            short: ['月', '火', '水', '木', '金', '土', '日'],
            long: [
                '月曜日',
                '火曜日',
                '水曜日',
                '木曜日',
                '金曜日',
                '土曜日',
                '日曜日',
            ],
        },
        dayPeriod: {
            amPm: ['午前', '午後'],
        },
    },
} as const satisfies Record<
    string,
    Record<string, Record<string, Record<string, string> | readonly string[]>>
>;

/**
 * 整形/解析で使用するロケール
 *
 * 以下のものが使用できます。
 *
 * - `en-US` 英語(デフォルト)
 *
 *   以下の文字列が使用されます。
 *
 *   | 書式指定子       | 結果                  |
 *   |------------------|-----------------------|
 *   | `MMM`            | `Jan`〜`Dec`          |
 *   | `MMMM`           | `January`〜`December` |
 *   | `E`, `EE`, `EEE` | `Mon`〜`Sun`          |
 *   | `EEEE`           | `Monday`〜`Sunday`    |
 *   | `a`              | `AM`, `PM`            |
 *
 * - `ja-JP` 日本語
 *
 *   以下の文字列が使用されます。
 *
 *   | 書式指定子       | 結果                |
 *   |------------------|---------------------|
 *   | `MMM`, `MMMM`    | `1月`〜`12月`       |
 *   | `E`, `EE`, `EEE` | `月`〜`日`          |
 *   | `EEEE`           | `月曜日`〜`日曜日`  |
 *   | `a`              | `午前`, `午後`      |
 *
 * 上記以外を指定するとエラーになります。
 */
export type Locale = keyof typeof LOCALES;
export type MonthType = keyof (typeof LOCALES)[Locale]['month'];
export type DayOfWeekType = keyof (typeof LOCALES)[Locale]['dayOfWeek'];

export type WithValue = Omit<
    Extract<FormatTarget, { with(..._: never): unknown }>['with'] extends (
        _: infer R,
    ) => unknown
        ? R
        : never,
    // eraには対応しない
    | 'era'
    | 'eraYear'
    // offsetはwithでは効果がない?
    | 'offset'
    // 月にはmonthCodeを使うのでmonthは除外
    | 'month'
>;
export type DateTimeProperties = keyof WithValue;

export const ORDER_PROPERTIES = [
    'year',
    'monthCode',
    'day',
    'hour',
    'minute',
    'second',
    'millisecond',
    'microsecond',
    'nanosecond',
] as const satisfies DateTimeProperties[];

export const DATE_TIME_TOKEN = {
    y: 1,
    M: 1,
    d: 1,
    a: 1,
    H: 1,
    h: 1,
    m: 1,
    s: 1,
    S: 1,
} as const satisfies {
    // DateTimePropertiesがpに含まれる書式指定子を抽出
    [Char in keyof FormatTokenMap as FormatTokenMap[Char]['properties'][number] extends DateTimeProperties
        ? Char
        : never]: 1;
};
export type DateTimeToken = keyof typeof DATE_TIME_TOKEN;

export const OFFSET_TOKEN = {
    x: 1,
    X: 1,
} as const satisfies {
    // offsetがpに含まれる書式指定子を抽出
    [Char in keyof FormatTokenMap as FormatTokenMap[Char]['properties'][number] extends 'offset'
        ? Char
        : never]: 1;
};
export type OffsetToken = keyof typeof OFFSET_TOKEN;

export type Char2Digit = keyof {
    [Char in keyof FormatTokenMap as FormatTokenMap[Char] extends {
        length: [1, 2];
        properties: [string];
    }
        ? Char
        : never]: 1;
};

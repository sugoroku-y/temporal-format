import type { FormatTarget } from './FormatTarget';
import type { AllPropertyNames, Alphabet4 } from './types';

export const propertyMap = {
    /** 下２桁の西暦 */
    yy: 'year',
    /** 桁揃えなしの西暦 */
    yyyy: 'year',
    /** 桁揃えなしの月 */
    M: 'monthCode',
    /** 桁揃えありの月 */
    MM: 'monthCode',
    /** 月の英語略称 */
    MMM: 'monthCode',
    /** 月の英語表記 */
    MMMM: 'monthCode',
    /** 桁揃えなしの日 */
    d: 'day',
    /** 桁揃えありの日 */
    dd: 'day',
    /** 桁揃えなしの時間（0-23） */
    H: 'hour',
    /** 桁揃えありの時間（00-23） */
    HH: 'hour',
    /** 桁揃えなしの時間（1-12） */
    h: 'hour',
    /** 桁揃えありの時間（01-12） */
    hh: 'hour',
    /** 午前/午後(表記としてはAM/PM) */
    a: 'hour',
    /** 桁揃えなしの分 */
    m: 'minute',
    /** 桁揃えありの分 */
    mm: 'minute',
    /** 桁揃えなしの秒 */
    s: 'second',
    /** 桁揃えありの秒 */
    ss: 'second',
    /** １桁の小数点以下の秒 */
    S: 'millisecond',
    /** ２桁の小数点以下の秒 */
    SS: 'millisecond',
    /** ３桁の小数点以下の秒 */
    SSS: 'millisecond',
    /** 9桁の小数点以下の秒 */
    SSSS: 'millisecond',
    /** 曜日（英語略称） */
    E: 'dayOfWeek',
    /** 曜日（英語略称） */
    EEE: 'dayOfWeek',
    /** 曜日（英語表記） */
    EEEE: 'dayOfWeek',
    /** オフセット(UTCの場合はZ、それ以外は±HH、ただし分単位のオフセットがある場合は±HHmm) */
    X: 'offsetNanoseconds',
    /** オフセット(UTCの場合はZ、それ以外は±HHmm) */
    XX: 'offsetNanoseconds',
    /** オフセット(UTCの場合はZ、それ以外は±HH:mm) */
    XXX: 'offsetNanoseconds',
    /** オフセット(常に±HH、ただし分単位のオフセットがある場合は±HHmm) */
    x: 'offsetNanoseconds',
    /** オフセット(常に±HHmm) */
    xx: 'offsetNanoseconds',
    /** オフセット(常に±HH:mm) */
    xxx: 'offsetNanoseconds',
} as const satisfies Partial<Record<Alphabet4, AllPropertyNames<FormatTarget>>>;

export type PropertyMap = typeof propertyMap;

export const LOCALES = {
    'en-US': {
        month: {
            numeric: {
                M01: '1',
                M02: '2',
                M03: '3',
                M04: '4',
                M05: '5',
                M06: '6',
                M07: '7',
                M08: '8',
                M09: '9',
                M10: '10',
                M11: '11',
                M12: '12',
            },
            two_digits: {
                M01: '01',
                M02: '02',
                M03: '03',
                M04: '04',
                M05: '05',
                M06: '06',
                M07: '07',
                M08: '08',
                M09: '09',
                M10: '10',
                M11: '11',
                M12: '12',
            },
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
        daypart: {
            amPm: ['AM', 'PM'],
        },
    },
    'ja-JP': {
        month: {
            numeric: {
                M01: '1',
                M02: '2',
                M03: '3',
                M04: '4',
                M05: '5',
                M06: '6',
                M07: '7',
                M08: '8',
                M09: '9',
                M10: '10',
                M11: '11',
                M12: '12',
            },
            two_digits: {
                M01: '01',
                M02: '02',
                M03: '03',
                M04: '04',
                M05: '05',
                M06: '06',
                M07: '07',
                M08: '08',
                M09: '09',
                M10: '10',
                M11: '11',
                M12: '12',
            },
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
        daypart: {
            amPm: ['午前', '午後'],
        },
    },
} as const satisfies Record<
    string,
    Record<string, Record<string, Record<string, string> | readonly string[]>>
>;

export type Locale = keyof typeof LOCALES;
export type MonthType = keyof (typeof LOCALES)[Locale]['month'];
export type DayOfWeekType = keyof (typeof LOCALES)[Locale]['dayOfWeek'];

export const DATE_TIME_PROPERTIES = {
    year: 1,
    monthCode: 1,
    day: 1,
    hour: 1,
    minute: 1,
    second: 1,
    millisecond: 1,
} satisfies Partial<Record<PropertyMap[keyof PropertyMap], 1>>;
export type DateTimeProperties = keyof typeof DATE_TIME_PROPERTIES;

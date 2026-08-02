import type { FormatTarget } from './FormatTarget';
import type { TargetFor } from './TargetFor';
import { TemporalFormatError } from './TemporalFormatError';
import type { ValidateFormatString } from './ValidateFormatString';
import { assert } from './asserts';
import {
    CHAR_TO_2DIGIT_TOKEN,
    FORMAT_TOKEN_MAP,
    LOCALES,
    type FormatTokenMap,
    type Locale,
} from './constants';
import { entry as entryBase } from './entry';
import { isKeyOf } from './isKeyOf';
import { messageKeys } from './messages';
import { parseAndValidate } from './parseAndValidate';
import type { EnableAccessingNonProperty, UnionToIntersection } from './types';

function padNumber(value: number, length = 2): string {
    return String(value).padStart(length, '0');
}

type FormatFunction<Char extends keyof FormatTokenMap> = UnionToIntersection<
    Char extends Char
        ? (
              target: Pick<
                  Temporal.ZonedDateTime,
                  FormatTokenMap[Char]['properties'][number]
              >,
              token: [Char, length: FormatTokenMap[Char]['length'][number]],
              options: { locale: Locale },
          ) => string
        : never
>;

const entry: <Char extends keyof FormatTokenMap>(
    chars: Char | Char[],
    func: FormatFunction<Char>,
) => Record<Char, FormatFunction<Char>> = entryBase;

const formatMap: {
    [Char in keyof FormatTokenMap]: FormatFunction<Char>;
} = {
    ...entry('y', ({ year }, [, length]) => {
        if (length === 2) {
            return padNumber(year % 100);
        }
        return String(year);
    }),
    ...entry('M', ({ monthCode }, [, length], { locale }): string => {
        if (length === 1 || length === 2) {
            const re = length === 1 ? /1[0-2]?|[2-9]/g : /0[1-9]|1[0-2]/g;
            const month = re.exec(monthCode)?.[0];
            assert(month, TemporalFormatError, messageKeys.invalidMonthCode, {
                monthCode,
            });
            return month;
        }
        const monthType = length === 3 ? 'short' : 'long';
        const table = LOCALES[locale].month[monthType];
        assert(
            isKeyOf(monthCode, table),
            TemporalFormatError,
            messageKeys.invalidMonthCode,
            { monthCode },
        );
        return table[monthCode];
    }),
    ...entry(CHAR_TO_2DIGIT_TOKEN, (d, [char, length]) => {
        const property = FORMAT_TOKEN_MAP[char].properties[0];
        let value = (d as Record<typeof property, number>)[property];
        if (char === 'h') {
            // 12時間表記のときだけは値に加工が必要
            value = ((value + 11) % 12) + 1;
        }
        if (length === 1) {
            return String(value);
        }
        return padNumber(value);
    }),
    ...entry(
        'E',
        ({ dayOfWeek }, [, length], { locale }) =>
            LOCALES[locale].dayOfWeek[length === 4 ? 'long' : 'short'][
                dayOfWeek - 1
            ],
    ),
    ...entry(
        'a',
        ({ hour }, _, { locale }) =>
            LOCALES[locale].dayPeriod.amPm[Math.floor(hour / 12)],
    ),
    ...entry('S', (d, [, length]) => {
        return `${padNumber(d.millisecond, 3)}${
            // 3桁より大きいときだけmicrosecondを使う
            length > 3 ? padNumber(d.microsecond, 3) : ''
        }${
            // 6桁より大きいときだけnanosecondを使う
            length > 6 ? padNumber(d.nanosecond, 3) : ''
        }`.slice(0, length);
    }),
    ...entry(['X', 'x'], ({ offset }, [char, length]) => {
        if (char === 'X' && offset === '+00:00') {
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
    }),
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
    assert(
        isKeyOf(locale, LOCALES),
        TemporalFormatError,
        messageKeys.unsupportedLocale,
        {
            locale,
        },
    );
    assert(
        target.calendarId === undefined || target.calendarId === 'iso8601',
        TemporalFormatError,
        messageKeys.unsupportedCalendarId,
        {
            calendarId:
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- 使用されるときにはtarget.calendarIdは非NULLなので問題ない
                target.calendarId!,
        },
    );
    const options = { locale } satisfies { locale: Locale };
    const nodes = parseAndValidate(formatString, target, 'format');
    const result: string[] = [];
    for (const node of nodes) {
        if (typeof node === 'string') {
            result.push(node);
            continue;
        }
        const [char] = node;
        const formatFunc = formatMap[char] as (
            t: typeof target,
            n: typeof node,
            o: typeof options,
        ) => string;
        result.push(formatFunc(target, node, options));
    }
    return result.join('');
}

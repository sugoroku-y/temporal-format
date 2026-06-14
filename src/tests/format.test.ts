import { format } from '../format';

describe('format', () => {
    const target = Temporal.PlainDateTime.from({
        year: 2026,
        month: 8,
        day: 6,
        hour: 21,
        minute: 3,
        second: 5,
        millisecond: 123,
    });

    it('formats basic date tokens', () => {
        expect(format(target, 'yyyy-MM-dd')).toBe('2026-08-06');
        expect(format(target, 'yy-M-d')).toBe('26-8-6');
    });

    it('formats hour, minute, second, and AM/PM tokens', () => {
        expect(format(target, 'H:mm:ss')).toBe('21:03:05');
        expect(format(target, 'h:mm a')).toBe('9:03 PM');
        expect(format(target, 'hh:mm a')).toBe('09:03 PM');
    });

    it('formats quoted literal text and escaped single quotes', () => {
        expect(format(target, "yyyy'年'M'月'd'日'")).toBe('2026年8月6日');
        expect(format(target, "H 'o''clock'")).toBe("21 o'clock");
    });

    it('uses every supported token in one format string', () => {
        const allFormat =
            "yyyy yy d dd H HH h hh a m mm s ss S SS SSS SSSS E EEE EEEE 'X' 'o''clock'";

        const out = format(target, allFormat, { locale: 'en-US' });

        expect(out).toBe(
            "2026 26 6 06 21 21 9 09 PM 3 03 5 05 1 12 123 123000000 Thu Thu Thursday X o'clock",
        );
    });

    it('formats month tokens separately', () => {
        expect(format(target, 'M MM MMM MMMM', { locale: 'en-US' })).toBe(
            '8 08 Aug August',
        );
    });

    it('formats weekday tokens', () => {
        expect(format(target, 'E EEE EEEE', { locale: 'en-US' })).toBe(
            'Thu Thu Thursday',
        );
    });

    it('formats weekday tokens and AM/PM for ja-JP locale', () => {
        expect(format(target, 'E EEE EEEE a', { locale: 'ja-JP' })).toBe(
            '木 木 木曜日 午後',
        );
    });

    it('accepts locale options and returns a string', () => {
        expect(typeof format(target, 'yyyy/MM/dd', { locale: 'ja-JP' })).toBe(
            'string',
        );
    });

    it('throws when the format string contains no date-time tokens', () => {
        let f = "'hello'";
        expect(() => format(target, f)).toThrow(
            "書式文字列がありません: 'hello'",
        );
    });

    describe('12 hour', () => {
        const time = Temporal.PlainTime.from('00:00');
        it.each([
            [0, '12AM', '12AM'],
            [1, '1AM', '01AM'],
            [2, '2AM', '02AM'],
            [3, '3AM', '03AM'],
            [4, '4AM', '04AM'],
            [5, '5AM', '05AM'],
            [6, '6AM', '06AM'],
            [7, '7AM', '07AM'],
            [8, '8AM', '08AM'],
            [9, '9AM', '09AM'],
            [10, '10AM', '10AM'],
            [11, '11AM', '11AM'],
            [12, '12PM', '12PM'],
            [13, '1PM', '01PM'],
            [14, '2PM', '02PM'],
            [15, '3PM', '03PM'],
            [16, '4PM', '04PM'],
            [17, '5PM', '05PM'],
            [18, '6PM', '06PM'],
            [19, '7PM', '07PM'],
            [20, '8PM', '08PM'],
            [21, '9PM', '09PM'],
            [22, '10PM', '10PM'],
            [23, '11PM', '11PM'],
        ])("%d o'clock is %s", (hour, numeric, twoDigits) => {
            const t = time.with({ hour });
            expect(format(t, 'ha')).toBe(numeric);
            expect(format(t, 'hha')).toBe(twoDigits);
        });
    });

    describe('timezone', () => {
        const d = Temporal.PlainDateTime.from('2020-07-05');
        it.each([
            ['X', '+09', 'Asia/Tokyo'],
            ['XX', '+0900', 'Asia/Tokyo'],
            ['XXX', '+09:00', 'Asia/Tokyo'],
            ['x', '+09', 'Asia/Tokyo'],
            ['xx', '+0900', 'Asia/Tokyo'],
            ['xxx', '+09:00', 'Asia/Tokyo'],
            ['X', 'Z', 'UTC'],
            ['XX', 'Z', 'UTC'],
            ['XXX', 'Z', 'UTC'],
            ['x', '+00', 'UTC'],
            ['xx', '+0000', 'UTC'],
            ['xxx', '+00:00', 'UTC'],
            ['X', '+0530', 'Asia/Colombo'],
            ['XX', '+0530', 'Asia/Colombo'],
            ['XXX', '+05:30', 'Asia/Colombo'],
            ['x', '+0530', 'Asia/Colombo'],
            ['xx', '+0530', 'Asia/Colombo'],
            ['xxx', '+05:30', 'Asia/Colombo'],
            ['X', '-0230', 'America/St_Johns'],
            ['XX', '-0230', 'America/St_Johns'],
            ['XXX', '-02:30', 'America/St_Johns'],
            ['x', '-0230', 'America/St_Johns'],
            ['xx', '-0230', 'America/St_Johns'],
            ['xxx', '-02:30', 'America/St_Johns'],
        ])(
            'formats timezone tokens correctly',
            (formatString, expected, timeZone) => {
                expect(format(d.toZonedDateTime(timeZone), formatString)).toBe(
                    expected,
                );
            },
        );
    });
    describe('others', () => {
        const d = Temporal.Now.plainDateISO();

        it('Unknown monthCode', () => {
            expect(
                format({ monthCode: 'M13' } as Temporal.PlainDate, 'M'),
            ).toBe('M13');
        });
        it('unclosed quotation', () => {
            expect(() =>
                // @ts-expect-error
                format(d, "yyyy-'MM-dd"),
            ).toThrow("引用符が閉じられていません: yyyy-'MM-dd");
        });
        it('too long format string', () => {
            expect(() =>
                // @ts-expect-error
                format(d, 'yyyyy-MM-dd'),
            ).toThrow('5文字以上の書式文字列はサポートされていません: yyyyy');
        });
        it('unsupported format string', () => {
            expect(() =>
                //@ts-expect-error
                format(d, 'yyy-MM-dd'),
            ).toThrow('無効な書式文字列です: yyy');
        });
        it('property not found', () => {
            expect(() =>
                // @ts-expect-error
                format(d, 'HH:mm:ss.SSSS'),
            ).toThrow('PlainDateにプロパティhourがありません: HH');
        });
        it('no format string', () => {
            expect(() => {
                // @ts-expect-error
                format(d, "'yyyy-MM-dd'");
            }).toThrow("書式文字列がありません: 'yyyy-MM-dd'");
        });
        it('unsupported locale', () => {
            expect(() =>
                format(Temporal.Now.zonedDateTimeISO(), 'E', {
                    // @ts-expect-error サポート外のロケールを指定した場合の確認のためエラーになるロケールを指定
                    locale: 'unsupported-locale',
                }),
            ).toThrow('ロケールunsupported-localeはサポートされていません');
        });
        it('quoted literal', () => {
            const d = Temporal.PlainDate.from('2020-01-02');
            expect(format(d, "yyyy 'year' MM 'month' dd 'day'")).toBe(
                '2020 year 01 month 02 day',
            );
            expect(format(d, "yyyy '' MM 'mon''th' dd")).toBe(
                "2020 ' 01 mon'th 02",
            );
        });
        it('twice error', () => {
            expect(() =>
                // @ts-expect-error
                format(d, 'yyy-MM-dd'),
            ).toThrow();
            expect(() =>
                // @ts-expect-error
                format(d, 'yyy-MM-dd'),
            ).toThrow();
        });
    });
});

import { padNumber } from '../padNumber';
import { parse } from '../parse';

describe('parse', () => {
    it('parses a plain date with a reference date', () => {
        const reference = Temporal.PlainDate.from({
            year: 2026,
            month: 1,
            day: 1,
        });

        expect(parse('2026-08-06', 'yyyy-MM-dd', reference)).toEqual(
            Temporal.PlainDate.from({ year: 2026, month: 8, day: 6 }),
        );
    });

    it('parses date-time values with AM/PM', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 1,
            minute: 0,
            second: 0,
        });

        expect(parse('09:03 PM', 'hh:mm a', reference)).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
                second: 0,
            }),
        );
    });

    it('parses quoted literal text in the format string', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 21,
            minute: 3,
            second: 5,
        });

        expect(parse('T21:03:05', "'T'HH:mm:ss", reference)).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
                second: 5,
            }),
        );
    });

    it('accepts locale options when parsing', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 21,
            minute: 3,
        });

        expect(
            parse('2026/08/06 21:03', 'yyyy/MM/dd HH:mm', reference, {
                locale: 'ja-JP',
            }),
        ).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
            }),
        );
    });

    it('parses weekday tokens and AM/PM when locale is ja-JP', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 21,
            minute: 3,
            second: 5,
        });

        const fmt = 'E EE EEE EEEE a yyyy/MM/dd hh:mm';
        const text = '木 木 木 木曜日 午後 2026/08/06 09:03';

        expect(parse(text, fmt, reference, { locale: 'ja-JP' })).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
                second: 0,
            }),
        );
    });

    it('parses year/month/day tokens', () => {
        const reference = Temporal.PlainDate.from({
            year: 2026,
            month: 1,
            day: 1,
        });

        expect(parse('2026 08 06', 'yyyy MM dd', reference)).toEqual(
            Temporal.PlainDate.from({ year: 2026, month: 8, day: 6 }),
        );
    });

    it('parses abbreviated month name (MMM)', () => {
        const reference = Temporal.PlainDate.from({
            year: 2026,
            month: 1,
            day: 1,
        });

        expect(parse('Aug 6 2026', 'MMM d yyyy', reference)).toEqual(
            Temporal.PlainDate.from({ year: 2026, month: 8, day: 6 }),
        );
    });

    it('parses full month name (MMMM)', () => {
        const reference = Temporal.PlainDate.from({
            year: 2026,
            month: 1,
            day: 1,
        });

        expect(parse('August 6 2026', 'MMMM d yyyy', reference)).toEqual(
            Temporal.PlainDate.from({ year: 2026, month: 8, day: 6 }),
        );
    });

    it('parses 24-hour time tokens', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 0,
            minute: 0,
            second: 0,
        });

        expect(parse('21:03:05', 'HH:mm:ss', reference)).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
                second: 5,
            }),
        );
    });

    it('parses 12-hour time tokens with AM/PM', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 0,
            minute: 0,
            second: 0,
        });

        expect(parse('9:03 PM', 'h:mm a', reference)).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
                second: 0,
            }),
        );
    });

    it('parses milliseconds (SSS) separately', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 0,
            minute: 0,
            second: 5,
            millisecond: 0,
        });

        expect(parse('05.123', 'ss.SSS', reference)).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 0,
                minute: 0,
                second: 5,
                millisecond: 123,
            }),
        );
    });

    describe('parses subsecond token', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 0,
            minute: 0,
            second: 5,
            millisecond: 0,
        });
        it.each([
            [1, '1', 'S', 100, 0, 0],
            [2, '12', 'SS', 120, 0, 0],
            [3, '123', 'SSS', 123, 0, 0],
            [4, '1234', 'SSSS', 123, 400, 0],
            [5, '12345', 'SSSSS', 123, 450, 0],
            [6, '123456', 'SSSSSS', 123, 456, 0],
            [7, '1234567', 'SSSSSSS', 123, 456, 700],
            [8, '12345678', 'SSSSSSSS', 123, 456, 780],
            [9, '123456789', 'SSSSSSSSS', 123, 456, 789],
        ] as const)(
            '%d-digits %s with %s',
            (
                _digits,
                input,
                formatString,
                millisecond,
                microsecond,
                nanosecond,
            ) => {
                expect(parse(input, formatString, reference)).toEqual(
                    expect.objectContaining({
                        millisecond,
                        microsecond,
                        nanosecond,
                    }),
                );
            },
        );
    });

    it('parses weekday tokens (en-US)', () => {
        const reference = Temporal.PlainDateTime.from({
            year: 2026,
            month: 8,
            day: 6,
            hour: 21,
            minute: 3,
            second: 5,
        });

        const fmt = 'E EEE EEEE yyyy/MM/dd HH:mm';
        const text = 'Thu Thu Thursday 2026/08/06 21:03';

        expect(parse(text, fmt, reference, { locale: 'en-US' })).toEqual(
            Temporal.PlainDateTime.from({
                year: 2026,
                month: 8,
                day: 6,
                hour: 21,
                minute: 3,
                second: 0,
            }),
        );
    });

    it("returns undefined when input doesn't match the format", () => {
        const reference = Temporal.PlainDate.from({
            year: 2026,
            month: 1,
            day: 1,
        });

        expect(parse('not-a-date', 'yyyy-MM-dd', reference)).toBeUndefined();
    });

    it('throws when the format string contains no date-time tokens', () => {
        const reference = Temporal.PlainDate.from({
            year: 2026,
            month: 1,
            day: 1,
        });

        expect(() =>
            // @ts-expect-error 例外のテストのためコンパイルエラーになるような呼び出しをする
            parse('hello', "'hello'", reference),
        ).toThrow("書式文字列がありません: 'hello'");
    });
    it('unsupported locale', () => {
        const reference = Temporal.Now.zonedDateTimeISO();
        expect(() =>
            parse('2020-11-31', 'yyyy-MM-dd', reference, {
                // @ts-expect-error サポートしていないロケールを指定するとコンパイルエラーになる
                locale: 'fr-FR',
            }),
        ).toThrow('サポートしていないロケール: fr-FR');
    });
    it('parse failure', () => {
        const reference = Temporal.Now.zonedDateTimeISO();
        expect(
            parse('2020-11-31', 'yyyy-MM-dd', reference, {
                overflow: 'reject',
            }),
        ).toBeUndefined();
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
        ] as const)("%d o'clock is %s", (hour, numeric, twoDigits) => {
            expect(parse(numeric, 'ha', time)?.hour).toBe(hour);
            expect(parse(twoDigits, 'hha', time)?.hour).toBe(hour);
        });
    });
    describe('timezone', () => {
        const d =
            Temporal.PlainDateTime.from('2020-07-05').toZonedDateTime(
                'Asia/Tokyo',
            );
        it.each([
            [1, 'X', 'Z', 9, 0],
            [2, 'XX', 'Z', 9, 0],
            [3, 'XXX', 'Z', 9, 0],
            [4, 'x', '+00', 9, 0],
            [5, 'xx', '+0000', 9, 0],
            [6, 'xxx', '+00:00', 9, 0],
            [7, 'X', '+09', 0, 0],
            [8, 'XX', '+0900', 0, 0],
            [9, 'XXX', '+09:00', 0, 0],
            [10, 'x', '+09', 0, 0],
            [11, 'xx', '+0900', 0, 0],
            [12, 'xxx', '+09:00', 0, 0],
            [13, 'X', '+0530', 3, 30],
            [14, 'XX', '+0530', 3, 30],
            [15, 'XXX', '+05:30', 3, 30],
            [16, 'x', '+0530', 3, 30],
            [17, 'xx', '+0530', 3, 30],
            [18, 'xxx', '+05:30', 3, 30],
            [19, 'X', '-0230', 11, 30],
            [20, 'XX', '-0230', 11, 30],
            [21, 'XXX', '-02:30', 11, 30],
            [22, 'x', '-0230', 11, 30],
            [23, 'xx', '-0230', 11, 30],
            [24, 'xxx', '-02:30', 11, 30],
        ] as const)(
            '%d. parse timezone tokens correctly',
            (_i, formatString, input, hour, minute) => {
                const result = parse(
                    `00:00 ${input}`,
                    `HH:mm ${formatString}`,
                    d,
                );
                expect(result?.hour).toBe(hour);
                expect(result?.minute).toBe(minute);
            },
        );
    });
    describe('others', () => {
        it('fractional second', () => {
            const reference = Temporal.PlainTime.from('00:00');
            expect(parse('5', 'S', reference)?.millisecond).toBe(500);
            expect(parse('56', 'SS', reference)?.millisecond).toBe(560);
            expect(parse('567', 'SSS', reference)?.millisecond).toBe(567);
            expect(parse('567890123', 'SSSSSSSSS', reference)).toEqual(
                expect.objectContaining({
                    millisecond: 567,
                    microsecond: 890,
                    nanosecond: 123,
                }),
            );
        });
        it('numeric time', () => {
            const reference = Temporal.PlainTime.from('00:00');
            expect(parse('5', 'H', reference)?.hour).toBe(5);
            expect(parse('5', 'm', reference)?.minute).toBe(5);
            expect(parse('5', 's', reference)?.second).toBe(5);
        });
        it('this century', () => {
            const reference = Temporal.Now.plainDateISO();
            const thisYear = reference.year;
            const year2digits = (thisYear + 50) % 100;
            expect(parse(padNumber(year2digits), 'yy', reference)?.year).toBe(
                Math.floor(thisYear / 100) * 100 + year2digits,
            );
        });
        it('neighbouring century', () => {
            const reference = Temporal.Now.plainDateISO();
            const thisYear = reference.year;
            const year2digits = (thisYear + 51) % 100;
            expect(
                parse(padNumber(year2digits), 'yy', reference)?.year,
            ).not.toBe(Math.floor(thisYear / 100) * 100 + year2digits);
        });
        it('numeric date', () => {
            const reference = Temporal.PlainDate.from('2020-01-01');
            expect(parse('5', 'M', reference)?.month).toBe(5);
        });
        it('rest string', () => {
            const reference = Temporal.PlainTime.from('00:00');
            expect(parse('12:34:56', 'HH:mm', reference)).toBeUndefined();
        });
        it('literal not match', () => {
            const reference = Temporal.PlainDate.from('2020-01-01');
            expect(
                parse('2020/02/02', 'yyyy-MM-dd', reference),
            ).toBeUndefined();
        });
        it('year only', () => {
            const reference = Temporal.PlainDate.from('2020-01-01');
            expect(parse('2021', 'yyyy', reference)?.year).toBe(2021);
        });
        it('unknown month', () => {
            const reference = Temporal.PlainDate.from('2020-01-01');
            expect(parse('unknown', 'MMMM', reference)).toBeUndefined();
        });
        it('unknown day of week', () => {
            const reference = Temporal.PlainDate.from('2020-01-01');
            expect(parse('5 Zen', 'd E', reference)).toBeUndefined();
        });
        it('format string error for parse', () => {
            const reference = Temporal.Now.zonedDateTimeISO();
            expect(() =>
                // @ts-expect-error 例外のテストのためコンパイルエラーになるような呼び出しをする
                parse('', 'E EEE EEEE X XX XXX x xx xxx', reference),
            ).toThrow(
                '日付か時刻の書式文字列がありません: E EEE EEEE X XX XXX x xx xxx',
            );
            expect(() =>
                // @ts-expect-error 例外のテストのためコンパイルエラーになるような呼び出しをする
                parse('', 'a', reference),
            ).toThrow('午前/午後(a)がある場合、12時間表記(h/hh)も必要です');
            expect(() =>
                // @ts-expect-error 例外のテストのためコンパイルエラーになるような呼び出しをする
                parse('', 'h', reference),
            ).toThrow('12時間表記(h/hh)がある場合、午前/午後(a)も必要です');
        });
        it.skip('half century', () => {
            const reference = Temporal.Now.zonedDateTimeISO();
            expect(
                Math.floor(
                    (parse(
                        padNumber(
                            (Temporal.Now.plainDateISO().year + 50) % 100,
                        ),
                        'yy',
                        reference,
                    )?.year ?? 0) / 100,
                ),
            ).not.toBe(Math.floor(Temporal.Now.plainDateISO().year / 100));
        });
    });
});

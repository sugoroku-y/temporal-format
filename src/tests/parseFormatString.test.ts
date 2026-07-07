import { parseFormatString } from '../parseFormatString';

describe('parseFormatString', () => {
    it('parses a simple format string with tokens and literals', () => {
        expect(parseFormatString('yyyy-MM-dd')).toEqual([
            ['y', 4],
            '-',
            ['M', 2],
            '-',
            ['d', 2],
        ]);
    });

    it('parses format string with quoted literal text and escaped single quote', () => {
        expect(parseFormatString("yyyy'hello''world'HH")).toEqual([
            ['y', 4],
            "hello'world",
            ['H', 2],
        ]);
    });

    it('throws when an unknown format token is used', () => {
        expect(() => parseFormatString('yyyy-Q')).toThrow(
            '無効な書式指定子です: Q: yyyy-Q',
        );
    });

    it('throws when a quoted literal is not terminated', () => {
        expect(() => parseFormatString("yyyy-'open")).toThrow(
            "引用符'が閉じられていません: yyyy-'open",
        );
    });

    it('throws when the format string contains no format tokens', () => {
        expect(() => parseFormatString('123 / -')).toThrow(
            '書式文字列がありません: 123 / -',
        );
    });
});

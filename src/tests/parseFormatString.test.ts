import { parseFormatString } from '../parseFormatString';

describe('parseFormatString', () => {
  it('parses a simple format string with tokens and literals', () => {
    expect(parseFormatString('yyyy-MM-dd')).toEqual([
      ['yyyy'],
      '-',
      ['MM'],
      '-',
      ['dd'],
    ]);
  });

  it('parses format string with quoted literal text and escaped single quote', () => {
    expect(parseFormatString("yyyy'hello''world'HH")).toEqual([
      ['yyyy'],
      "hello'world",
      ['HH'],
    ]);
  });

  it('throws when an unknown format token is used', () => {
    expect(() => parseFormatString('yyyy-Q')).toThrow(
      '無効な書式文字列です: Q',
    );
  });

  it('throws when a quoted literal is not terminated', () => {
    expect(() => parseFormatString("yyyy-'open")).toThrow(
      "引用符が閉じられていません: yyyy-'open",
    );
  });

  it('throws when the format string contains no format tokens', () => {
    expect(() => parseFormatString('123 / -')).toThrow(
      '書式文字列がありません: 123 / -',
    );
  });

  it('throws when a format token is longer than 4 characters', () => {
    expect(() => parseFormatString('yyyyy')).toThrow(
      '5文字以上の書式文字列はサポートされていません: yyyyy',
    );
  });
});

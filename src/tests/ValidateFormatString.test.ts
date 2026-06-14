import type {
    AddErrorToken,
    AddFormatToken,
    AddLiteralToken,
    ErrorResult,
    ErrorToken,
    FormatToken,
    LiteralToken,
    ParseFormatString,
    ValidateFormatString,
} from '../ValidateFormatString';

// 型関数のテスト用
type ToEqual<Expected> = Expected;
type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;
type It<Name extends string, T extends true> = T extends true
    ? []
    : [Record<Name, T>];
type Expect<Actual, Expected> =
    Equal<Actual, Expected> extends true
        ? true
        : {
              actual: Actual;
              expected: Expected;
          };

it('AddFormatToken', () => {
    const Test_AddFormatToken: [
        ...It<
            '1. AddFormatToken',
            Expect<AddFormatToken<'M', []>, ToEqual<[['M']]>>
        >,
        ...It<
            '2. AddFormatToken',
            Expect<AddFormatToken<'M', [FormatToken<'M'>]>, ToEqual<[['MM']]>>
        >,
        ...It<
            '3. AddFormatToken',
            Expect<
                AddFormatToken<'M', [FormatToken<'MMMM'>]>,
                ToEqual<[['MMMMM']]>
            >
        >,
        ...It<
            '4. AddFormatToken',
            Expect<
                AddFormatToken<'M', AddFormatToken<'M', [FormatToken<'MMMM'>]>>,
                ToEqual<[['MMMMMM']]>
            >
        >,
    ]['length'] = 0;
    expect(Test_AddFormatToken).toBe(0);
});

it('AddLiteralToken', () => {
    const Test_AddLiteralToken: [
        ...It<
            '1. AddLiteralToken',
            Expect<AddLiteralToken<'hello', []>, ToEqual<['hello']>>
        >,
        ...It<
            '2. AddLiteralToken',
            Expect<
                AddLiteralToken<' world', [LiteralToken<'hello'>]>,
                ToEqual<['hello world']>
            >
        >,
        ...It<
            '3. AddLiteralToken',
            Expect<
                AddLiteralToken<' world', [FormatToken<'yyyy'>]>,
                ToEqual<[['yyyy'], ' world']>
            >
        >,
    ]['length'] = 0;
    expect(Test_AddLiteralToken).toBe(0);
});

it('AddErrorToken', () => {
    const Test_AddErrorToken: [
        ...It<
            '1. AddErrorToken',
            Expect<
                AddErrorToken<'error message', []>,
                ToEqual<[ErrorToken<'error message'>]>
            >
        >,
        ...It<
            '2. AddErrorToken',
            Expect<
                AddErrorToken<'error message', [FormatToken<'yyyy'>]>,
                ToEqual<[['yyyy'], ErrorToken<'error message'>]>
            >
        >,
    ]['length'] = 0;
    expect(Test_AddErrorToken).toBe(0);
});

it('ParseFormatString', () => {
    const Test_ParseFormatString: [
        ...It<
            '1. ParseFormatString',
            Expect<
                ParseFormatString<'yyyy-MM-dd'>,
                ToEqual<[['yyyy'], '-', ['MM'], '-', ['dd']]>
            >
        >,
        ...It<
            '2. ParseFormatString',
            Expect<
                ParseFormatString<"'hello''world'">,
                ToEqual<["hello'world"]>
            >
        >,
        ...It<
            '3. ParseFormatString',
            Expect<
                ParseFormatString<"'unclosed string">,
                ToEqual<
                    [ErrorToken<"引用符が閉じられていません: 'unclosed string">]
                >
            >
        >,
    ]['length'] = 0;
    expect(Test_ParseFormatString).toBe(0);
});

it('ValidateFormatString', () => {
    const Test_ValidateFormatString: [
        ...It<
            '1. ValidateFormatString',
            Expect<ValidateFormatString<'yyyy-MM-dd', 'format'>, ToEqual<[]>>
        >,
        ...It<
            '2. ValidateFormatString',
            Expect<
                ValidateFormatString<"yyyy-'MM-dd", 'format'>,
                ToEqual<
                    [] &
                        ErrorResult<"引用符が閉じられていません: -'MM-dd: yyyy-'MM-dd">
                >
            >
        >,
        ...It<
            '3. ValidateFormatString',
            Expect<
                ValidateFormatString<'yyyyy-MM-dd', 'format'>,
                ToEqual<
                    [] &
                        ErrorResult<'5文字以上の書式文字列はサポートされていません: yyyyy: yyyyy-MM-dd'>
                >
            >
        >,
        ...It<
            '4. ValidateFormatString',
            Expect<
                ValidateFormatString<'yyy-MM-dd', 'format'>,
                ToEqual<
                    [] & ErrorResult<'無効な書式文字列です: yyy: yyy-MM-dd'>
                >
            >
        >,
        ...It<
            '5. ValidateFormatString',
            Expect<ValidateFormatString<'yyyy-MM-dd', 'format'>, ToEqual<[]>>
        >,
        ...It<
            '6. ValidateFormatString',
            Expect<
                ValidateFormatString<"'yyyy-MM-dd'", 'format'>,
                ToEqual<
                    [] & ErrorResult<"書式文字列がありません: 'yyyy-MM-dd'">
                >
            >
        >,
        ...It<
            '7. ValidateFormatString',
            Expect<ValidateFormatString<string, 'format'>, ToEqual<[]>>
        >,
        ...It<
            '8. ValidateFormatString',
            Expect<ValidateFormatString<'HH:mm:ss.SSSS', 'format'>, ToEqual<[]>>
        >,
    ]['length'] = 0;
    expect(Test_ValidateFormatString).toBe(0);
});

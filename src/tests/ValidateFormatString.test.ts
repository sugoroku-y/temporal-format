import type {
    AddLiteral,
    AddToken,
    FailureResult,
    LiteralNode,
    ParseFormatString,
    TokenNode,
    ValidateFormatString,
    ValidationFailure,
    ValidationSuccess,
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

it('AddToken', () => {
    const tests: [
        ...It<
            '1. AddToken: 空だったら、新しいノードとして追加',
            Expect<AddToken<[], 'M'>, ToEqual<[TokenNode<'M'>]>>
        >,
        ...It<
            '2. AddToken: 同じ文字の書式指定子が最後なら、最後のノードに1文字追加',
            Expect<AddToken<[TokenNode<'M'>], 'M'>, ToEqual<[TokenNode<'MM'>]>>
        >,
        ...It<
            '3. AddToken: リテラル文字列が最後なら、新しいノードとして追加',
            Expect<
                AddToken<[LiteralNode<'abc'>], 'M'>,
                ToEqual<[LiteralNode<'abc'>, TokenNode<'M'>]>
            >
        >,
        ...It<
            '4. AddToken: 違う文字の書式指定子が最後なら、新しいノードとして追加',
            Expect<
                AddToken<[TokenNode<'m'>], 'M'>,
                ToEqual<[TokenNode<'m'>, TokenNode<'M'>]>
            >
        >,
    ] = [];
    expect(tests.length).toBe(0);
});

it('AddLiteral', () => {
    const tests: [
        ...It<
            '1. AddLiteral: 空だったら、新しいノードとして追加',
            Expect<AddLiteral<[], 'hello'>, ToEqual<[LiteralNode<'hello'>]>>
        >,
        ...It<
            '2. AddLiteral: リテラル文字列が最後なら、最後のリテラル文字列に文字列を追加',
            Expect<
                AddLiteral<[LiteralNode<'hello'>], ' world'>,
                ToEqual<[LiteralNode<'hello world'>]>
            >
        >,
        ...It<
            '3. AddLiteral: 書式文字列が最後なら、新しいノードとして追加',
            Expect<
                AddLiteral<[TokenNode<'yyyy'>], ' world'>,
                ToEqual<[TokenNode<'yyyy'>, LiteralNode<' world'>]>
            >
        >,
    ] = [];
    expect(tests.length).toBe(0);
});

it('ParseFormatString', () => {
    const tests: [
        ...It<
            '1. ParseFormatString: 一般的な書式文字列',
            Expect<
                ParseFormatString<'yyyy-MM-dd'>,
                ToEqual<
                    [
                        TokenNode<'yyyy'>,
                        LiteralNode<'-'>,
                        TokenNode<'MM'>,
                        LiteralNode<'-'>,
                        TokenNode<'dd'>,
                    ]
                >
            >
        >,
        ...It<
            '2. ParseFormatString: リテラル文字列だけ',
            Expect<
                ParseFormatString<"'hello''world'">,
                ToEqual<[LiteralNode<"hello'world">]>
            >
        >,
        ...It<
            '3. ParseFormatString: 閉じらてていない引用符',
            Expect<
                ParseFormatString<"'closed' 'unclosed yyyy">,
                ToEqual<FailureResult<'引用符が閉じられていません'>>
            >
        >,
        ...It<
            '4. ParseFormatString: 閉じられている引用符のあとにリテラル文字列としての引用符',
            Expect<
                ParseFormatString<"'closed' ''yyyy">,
                ToEqual<[LiteralNode<"closed '">, TokenNode<'yyyy'>]>
            >
        >,
    ] = [];
    expect(tests.length).toBe(0);
});

it('ValidateFormatString', () => {
    const tests: [
        ...It<
            '1. ValidateFormatString for format: 一般的な書式文字列(日付)',
            Expect<
                ValidateFormatString<'yyyy-MM-dd', 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '2. ValidateFormatString for format: 一般的な書式文字列(時刻)',
            Expect<
                ValidateFormatString<'HH:mm:ss.SSSS', 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '3. ValidateFormatString for format: 引用符が閉じられていません',
            Expect<
                ValidateFormatString<"yyyy-'MM-dd", 'format'>,
                ToEqual<
                    ValidationFailure<"引用符が閉じられていません: yyyy-'MM-dd">
                >
            >
        >,
        ...It<
            '4. ValidateFormatString for format: 書式指定子がありません(空文字列)',
            Expect<
                ValidateFormatString<'', 'format'>,
                ToEqual<ValidationFailure<'書式指定子がありません: '>>
            >
        >,
        ...It<
            '5. ValidateFormatString for format: 書式指定子がありません(リテラル文字列)',
            Expect<
                ValidateFormatString<"'yyyy-MM-dd'", 'format'>,
                ToEqual<
                    ValidationFailure<"書式指定子がありません: 'yyyy-MM-dd'">
                >
            >
        >,
        ...It<
            '6. ValidateFormatString for format: 無効な書式指定子です',
            Expect<
                ValidateFormatString<'yyy-MM-dd', 'format'>,
                ToEqual<
                    ValidationFailure<'無効な書式指定子です: yyy: yyy-MM-dd'>
                >
            >
        >,
        ...It<
            '7. ValidateFormatString for format: stringは検証成功',
            Expect<
                ValidateFormatString<string, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '8. ValidateFormatString for format: テンプレートリテラル型は検証成功',
            Expect<
                ValidateFormatString<`AAA${string}`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '9. ValidateFormatString for format: 書式指定子: yyyy',
            Expect<
                ValidateFormatString<`yyyy`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '10. ValidateFormatString for format: 書式指定子: yy',
            Expect<
                ValidateFormatString<`yy`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '11. ValidateFormatString for format: 書式指定子: M',
            Expect<
                ValidateFormatString<`M`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '12. ValidateFormatString for format: 書式指定子: MM',
            Expect<
                ValidateFormatString<`MM`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '13. ValidateFormatString for format: 書式指定子: MMM',
            Expect<
                ValidateFormatString<`MMM`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '14. ValidateFormatString for format: 書式指定子: MMMM',
            Expect<
                ValidateFormatString<`MMMM`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '15. ValidateFormatString for format: 書式指定子: d',
            Expect<
                ValidateFormatString<`d`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '16. ValidateFormatString for format: 書式指定子: dd',
            Expect<
                ValidateFormatString<`dd`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '17. ValidateFormatString for format: 書式指定子: H',
            Expect<
                ValidateFormatString<`H`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '18. ValidateFormatString for format: 書式指定子: HH',
            Expect<
                ValidateFormatString<`HH`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '19. ValidateFormatString for format: 書式指定子: h',
            Expect<
                ValidateFormatString<`h`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '20. ValidateFormatString for format: 書式指定子: hh',
            Expect<
                ValidateFormatString<`hh`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '21. ValidateFormatString for format: 書式指定子: a',
            Expect<
                ValidateFormatString<`a`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '22. ValidateFormatString for format: 書式指定子: m',
            Expect<
                ValidateFormatString<`m`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '23. ValidateFormatString for format: 書式指定子: mm',
            Expect<
                ValidateFormatString<`mm`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '24. ValidateFormatString for format: 書式指定子: s',
            Expect<
                ValidateFormatString<`s`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '25. ValidateFormatString for format: 書式指定子: ss',
            Expect<
                ValidateFormatString<`ss`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '26. ValidateFormatString for format: 書式指定子: S',
            Expect<
                ValidateFormatString<`S`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '27. ValidateFormatString for format: 書式指定子: SS',
            Expect<
                ValidateFormatString<`SS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '28. ValidateFormatString for format: 書式指定子: SSS',
            Expect<
                ValidateFormatString<`SSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '29. ValidateFormatString for format: 書式指定子: SSSS',
            Expect<
                ValidateFormatString<`SSSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '30. ValidateFormatString for format: 書式指定子: SSSSS',
            Expect<
                ValidateFormatString<`SSSSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '31. ValidateFormatString for format: 書式指定子: SSSSSS',
            Expect<
                ValidateFormatString<`SSSSSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '32. ValidateFormatString for format: 書式指定子: SSSSSSS',
            Expect<
                ValidateFormatString<`SSSSSSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '33. ValidateFormatString for format: 書式指定子: SSSSSSSS',
            Expect<
                ValidateFormatString<`SSSSSSSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '34. ValidateFormatString for format: 書式指定子: SSSSSSSSS',
            Expect<
                ValidateFormatString<`SSSSSSSSS`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '35. ValidateFormatString for format: 書式指定子: E',
            Expect<
                ValidateFormatString<`E`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '36. ValidateFormatString for format: 書式指定子: EE',
            Expect<
                ValidateFormatString<`EE`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '37. ValidateFormatString for format: 書式指定子: EEE',
            Expect<
                ValidateFormatString<`EEE`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '38. ValidateFormatString for format: 書式指定子: EEEE',
            Expect<
                ValidateFormatString<`EEEE`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '39. ValidateFormatString for format: 書式指定子: X',
            Expect<
                ValidateFormatString<`X`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '40. ValidateFormatString for format: 書式指定子: XX',
            Expect<
                ValidateFormatString<`XX`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '41. ValidateFormatString for format: 書式指定子: XXX',
            Expect<
                ValidateFormatString<`XXX`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '42. ValidateFormatString for format: 書式指定子: x',
            Expect<
                ValidateFormatString<`x`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '43. ValidateFormatString for format: 書式指定子: xx',
            Expect<
                ValidateFormatString<`xx`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '44. ValidateFormatString for format: 書式指定子: xxx',
            Expect<
                ValidateFormatString<`xxx`, 'format'>,
                ToEqual<ValidationSuccess>
            >
        >,
        // parseとformatはほぼ同じ仕様なのでformatで出るエラーはparseでも出る
        // ただし、formatで通るものもparseでは通らないことがあるので一部引数を変更
        ...It<
            '1. ValidateFormatString for parse: 一般的な書式文字列(日付)',
            Expect<
                ValidateFormatString<'yyyy-MM-dd', 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '2. ValidateFormatString for parse: 一般的な書式文字列(時刻)',
            Expect<
                ValidateFormatString<'HH:mm:ss.SSSS', 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '3. ValidateFormatString for parse: 引用符が閉じられていません',
            Expect<
                ValidateFormatString<"yyyy-'MM-dd", 'parse'>,
                ToEqual<
                    ValidationFailure<"引用符が閉じられていません: yyyy-'MM-dd">
                >
            >
        >,
        ...It<
            '4. ValidateFormatString for parse: 書式指定子がありません(空文字列)',
            Expect<
                ValidateFormatString<'', 'parse'>,
                ToEqual<ValidationFailure<'書式指定子がありません: '>>
            >
        >,
        ...It<
            '5. ValidateFormatString for parse: 書式指定子がありません(リテラル文字列)',
            Expect<
                ValidateFormatString<"'yyyy-MM-dd'", 'parse'>,
                ToEqual<
                    ValidationFailure<"書式指定子がありません: 'yyyy-MM-dd'">
                >
            >
        >,
        ...It<
            '6. ValidateFormatString for parse: 無効な書式指定子です',
            Expect<
                ValidateFormatString<'yyy-MM-dd', 'parse'>,
                ToEqual<
                    ValidationFailure<'無効な書式指定子です: yyy: yyy-MM-dd'>
                >
            >
        >,
        ...It<
            '7. ValidateFormatString for parse: stringは検証成功',
            Expect<
                ValidateFormatString<string, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '8. ValidateFormatString for parse: テンプレートリテラル型は検証成功',
            Expect<
                ValidateFormatString<`AAA${string}`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '9. ValidateFormatString for parse: 書式指定子: yyyy',
            Expect<
                ValidateFormatString<`yyyy`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '10. ValidateFormatString for parse: 書式指定子: yy',
            Expect<
                ValidateFormatString<`yy`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '11. ValidateFormatString for parse: 書式指定子: M',
            Expect<
                ValidateFormatString<`M`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '12. ValidateFormatString for parse: 書式指定子: MM',
            Expect<
                ValidateFormatString<`MM`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '13. ValidateFormatString for parse: 書式指定子: MMM',
            Expect<
                ValidateFormatString<`MMM`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '14. ValidateFormatString for parse: 書式指定子: MMMM',
            Expect<
                ValidateFormatString<`MMMM`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '15. ValidateFormatString for parse: 書式指定子: d',
            Expect<
                ValidateFormatString<`d`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '16. ValidateFormatString for parse: 書式指定子: dd',
            Expect<
                ValidateFormatString<`dd`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '17. ValidateFormatString for parse: 書式指定子: H',
            Expect<
                ValidateFormatString<`H`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '18. ValidateFormatString for parse: 書式指定子: HH',
            Expect<
                ValidateFormatString<`HH`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '19. ValidateFormatString for parse: 書式指定子: h',
            Expect<
                ValidateFormatString<`h a`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '20. ValidateFormatString for parse: 書式指定子: hh',
            Expect<
                ValidateFormatString<`hh a`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '21. ValidateFormatString for parse: 書式指定子: a',
            Expect<
                ValidateFormatString<`a h`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '22. ValidateFormatString for parse: 書式指定子: m',
            Expect<
                ValidateFormatString<`m`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '23. ValidateFormatString for parse: 書式指定子: mm',
            Expect<
                ValidateFormatString<`mm`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '24. ValidateFormatString for parse: 書式指定子: s',
            Expect<
                ValidateFormatString<`s`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '25. ValidateFormatString for parse: 書式指定子: ss',
            Expect<
                ValidateFormatString<`ss`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '26. ValidateFormatString for parse: 書式指定子: S',
            Expect<
                ValidateFormatString<`S`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '27. ValidateFormatString for parse: 書式指定子: SS',
            Expect<
                ValidateFormatString<`SS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '28. ValidateFormatString for parse: 書式指定子: SSS',
            Expect<
                ValidateFormatString<`SSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '29. ValidateFormatString for parse: 書式指定子: SSSS',
            Expect<
                ValidateFormatString<`SSSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '30. ValidateFormatString for parse: 書式指定子: SSSSS',
            Expect<
                ValidateFormatString<`SSSSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '31. ValidateFormatString for parse: 書式指定子: SSSSSS',
            Expect<
                ValidateFormatString<`SSSSSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '32. ValidateFormatString for parse: 書式指定子: SSSSSSS',
            Expect<
                ValidateFormatString<`SSSSSSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '33. ValidateFormatString for parse: 書式指定子: SSSSSSSS',
            Expect<
                ValidateFormatString<`SSSSSSSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '34. ValidateFormatString for parse: 書式指定子: SSSSSSSSS',
            Expect<
                ValidateFormatString<`SSSSSSSSS`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '35. ValidateFormatString for parse: 書式指定子: E',
            Expect<
                ValidateFormatString<`dE`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '36. ValidateFormatString for parse: 書式指定子: EE',
            Expect<
                ValidateFormatString<`dEE`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '37. ValidateFormatString for parse: 書式指定子: EEE',
            Expect<
                ValidateFormatString<`dEEE`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '38. ValidateFormatString for parse: 書式指定子: EEEE',
            Expect<
                ValidateFormatString<`dEEEE`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '39. ValidateFormatString for parse: 書式指定子: X',
            Expect<
                ValidateFormatString<`dX`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '40. ValidateFormatString for parse: 書式指定子: XX',
            Expect<
                ValidateFormatString<`dXX`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '41. ValidateFormatString for parse: 書式指定子: XXX',
            Expect<
                ValidateFormatString<`dXXX`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '42. ValidateFormatString for parse: 書式指定子: x',
            Expect<
                ValidateFormatString<`dx`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '43. ValidateFormatString for parse: 書式指定子: xx',
            Expect<
                ValidateFormatString<`dxx`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        ...It<
            '44. ValidateFormatString for parse: 書式指定子: xxx',
            Expect<
                ValidateFormatString<`d xxx`, 'parse'>,
                ToEqual<ValidationSuccess>
            >
        >,
        // parse固有のエラー
        ...It<
            '45. ValidateFormatString for parse: 日付や時刻の書式指定子がありません',
            Expect<
                ValidateFormatString<
                    `E EE EEE EEEE X XX XXX x xx xxx`,
                    'parse'
                >,
                ToEqual<
                    ValidationFailure<'日付や時刻の書式指定子がありません: E EE EEE EEEE X XX XXX x xx xxx'>
                >
            >
        >,
        ...It<
            '45. ValidateFormatString for parse: 午前/午後(a)がある場合、12時間表記(h/hh)も必要です',
            Expect<
                ValidateFormatString<`a`, 'parse'>,
                ToEqual<
                    ValidationFailure<'午前/午後(a)がある場合、12時間表記(h/hh)も必要です: a'>
                >
            >
        >,
        ...It<
            '45. ValidateFormatString for parse: 12時間表記(h/hh)がある場合、午前/午後(a)も必要です',
            Expect<
                ValidateFormatString<`h`, 'parse'>,
                ToEqual<
                    ValidationFailure<'12時間表記(h/hh)がある場合、午前/午後(a)も必要です: h'>
                >
            >
        >,
    ] = [];
    expect(tests.length).toBe(0);
});

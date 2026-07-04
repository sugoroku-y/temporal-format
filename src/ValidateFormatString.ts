import type { DateTimeToken, IsSupportedToken } from './constants';
import type {
    ExtractToken,
    FailureResult,
    ParseFormatString,
    ParseResult,
    TokenNode,
    TokenNodeToString,
} from './parseFormatString';
import type { Expect, It, ToEqual } from './type-test';
import type { FailoverIfNever, NonNullish } from './types';

/** 書式文字列の検証で問題がなかったとき */
export type ValidationSuccess = [];
/** 書式文字列の検証で問題があったとき */
export type ValidationFailure<Message extends string> = [] & {
    message: Message;
};

/**
 * 書式文字列の解析に失敗した場合はそのエラーメッセージを返す型関数
 *
 * 成功していればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateParsingSuccessfull<R extends ParseResult> =
    // 解析に失敗
    R extends FailureResult<infer Message extends string>
        ? // エラーメッセージを返す
          Message
        : // 成功していればneverを返す
          never;

/**
 * 書式文字列中に書式指定子がない場合はエラーメッセージを返す型関数
 *
 * ある場合はneverを返す
 * @template R ParseFormatStringの返り値
 *
 * 定義としてはFailureResultとのUnion型になっているが、実際にはSuccessResultになっている
 */
type ValidateTokenExistence<R extends ParseResult> =
    ExtractToken<R> extends ['no-token'] ? '書式指定子がありません' : never;

/**
 * 無効な書式指定子が指定されていればエラーメッセージを返す型関数
 *
 * 有効な書式指定子だけであればneverを返す
 * @template R ParseFormatStringの返り値
 *
 * 定義としてはFailureResultとのUnion型になっているが、実際の型には以下の前提がある。
 *
 * - SuccessResultである
 * - TokenNodeが含まれている
 */
type ValidateTokenSupported<R extends ParseResult> =
    // 解析結果から書式指定子を抽出してTokenに割当
    ExtractToken<R> extends infer Token extends TokenNode
        ? // TokenをUnion展開
          Token extends Token
            ? // 無効な書式指定子だったら
              IsSupportedToken<Token> extends false
                ? // メッセージを生成して返す
                  `無効な書式指定子です: ${TokenNodeToString<Token>}`
                : // 有効ならneverを返す
                  never
            : // TokenのUnion展開のためのextendsなのでここには来ない
              never
        : // 前提条件からここには来ない
          never;

/**
 * 日付や時刻の書式指定子がなければエラーメッセージを返す型関数
 *
 * あればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateDateTimeTokenExistence<R extends ParseResult> =
    // 解析結果から書式指定子を抽出してTokenに割当
    ExtractToken<R> extends infer Token extends TokenNode
        ? // 日付や時刻のプロパティだけを抽出し、それが空なら
          [Extract<Token, TokenNode<DateTimeToken>>] extends [never]
            ? // エラーメッセージを返す
              '日付や時刻の書式指定子がありません'
            : // 日付や時刻のプロパティがあればnever
              never
        : // 前提条件からここには来ない
          never;

/**
 * 午前午後の書式指定子と12時間制の時間の書式指定子がどちらか一方だけ指定されていればエラーメッセージを返す型関数
 *
 * どちらも指定されていない、もしくは両方指定されていればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateDayPeriodAnd12Hours<R extends ParseResult> =
    ExtractToken<R> extends infer Token extends TokenNode
        ? {
              // どちらも指定されていない
              __: never;
              // 両方指定されている
              ah: never;
              // 午前/午後だけ指定されている
              a_: '午前/午後(a)がある場合、12時間表記(h/hh)も必要です';
              // 12時間表記だけ指定されている
              _h: '12時間表記(h/hh)がある場合、午前/午後(a)も必要です';
          }[`${
              // aが含まれていれば`'a'`、なければ`'_'`
              FailoverIfNever<Extract<Token[0], 'a'>, '_'>
          }${
              // h/hhが含まれていれば`'h'`、なければ`'_'`
              FailoverIfNever<Extract<Token[0], 'h'>, '_'>
          }`]
        : // 前提条件からここには来ない
          never;

/** 書式文字列の利用目的 */
export type Purpose = 'format' | 'parse';

/**
 * 書式文字列を解析して問題があればエラーメッセージを返す型関数
 *
 * 問題がなければneverを返す。
 */
type ValidationMessage<R extends ParseResult, P extends Purpose> =
    // 書式文字列の解析に成功
    | ValidateParsingSuccessfull<R>
    // 書式指定子が存在する
    | ValidateTokenExistence<R>
    // 書式指定子が有効
    | ValidateTokenSupported<R>
    | {
          // formatの場合検証はここまで
          format: never;
          // parseの場合
          parse: // 日付や時刻の書式指定子を含む
              | ValidateDateTimeTokenExistence<R>
              // 午前午後と12時間制の時間は同時に使用
              | ValidateDayPeriodAnd12Hours<R>;
      }[P];

/**
 * 書式文字列を検証して失敗すればエラーメッセージ付きの空配列を返す型関数
 *
 * 成功すればただの空配列を返す。
 *
 * エラーメッセージ付きにすることで引数として指定できない状態になり、コンパイルエラーとなる。
 *
 * Sにstring型やテンプレートリテラル型を指定した場合は解析できないため検証成功とみなす。
 */
export type ValidateFormatString<S extends string, P extends Purpose> =
    // Sが文字列リテラル型でなければ
    NonNullish extends Record<S, never>
        ? // 解析できないので検証成功とみなす
          ValidationSuccess
        : // SをUnion展開
          S extends S
          ? // 検証結果をMessageに割当
            ValidationMessage<
                ParseFormatString<S>,
                P
            > extends infer Message extends string
              ? [Message] extends [never]
                  ? // 文字列でなければ検証成功
                    ValidationSuccess
                  : // 検証結果が文字列だったら検証失敗、結果をエラーメッセージとする
                    ValidationFailure<`${Message}: ${S}`>
              : never
          : never;

declare const _tests_ValidateFormatString: [
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
            ToEqual<ValidationFailure<"書式指定子がありません: 'yyyy-MM-dd'">>
        >
    >,
    ...It<
        '6. ValidateFormatString for format: 無効な書式指定子です',
        Expect<
            ValidateFormatString<'yyy-MM-dd', 'format'>,
            ToEqual<ValidationFailure<'無効な書式指定子です: yyy: yyy-MM-dd'>>
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
        Expect<ValidateFormatString<`yy`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '11. ValidateFormatString for format: 書式指定子: M',
        Expect<ValidateFormatString<`M`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '12. ValidateFormatString for format: 書式指定子: MM',
        Expect<ValidateFormatString<`MM`, 'format'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`d`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '16. ValidateFormatString for format: 書式指定子: dd',
        Expect<ValidateFormatString<`dd`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '17. ValidateFormatString for format: 書式指定子: H',
        Expect<ValidateFormatString<`H`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '18. ValidateFormatString for format: 書式指定子: HH',
        Expect<ValidateFormatString<`HH`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '19. ValidateFormatString for format: 書式指定子: h',
        Expect<ValidateFormatString<`h`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '20. ValidateFormatString for format: 書式指定子: hh',
        Expect<ValidateFormatString<`hh`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '21. ValidateFormatString for format: 書式指定子: a',
        Expect<ValidateFormatString<`a`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '22. ValidateFormatString for format: 書式指定子: m',
        Expect<ValidateFormatString<`m`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '23. ValidateFormatString for format: 書式指定子: mm',
        Expect<ValidateFormatString<`mm`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '24. ValidateFormatString for format: 書式指定子: s',
        Expect<ValidateFormatString<`s`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '25. ValidateFormatString for format: 書式指定子: ss',
        Expect<ValidateFormatString<`ss`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '26. ValidateFormatString for format: 書式指定子: S',
        Expect<ValidateFormatString<`S`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '27. ValidateFormatString for format: 書式指定子: SS',
        Expect<ValidateFormatString<`SS`, 'format'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`E`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '36. ValidateFormatString for format: 書式指定子: EE',
        Expect<ValidateFormatString<`EE`, 'format'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`X`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '40. ValidateFormatString for format: 書式指定子: XX',
        Expect<ValidateFormatString<`XX`, 'format'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`x`, 'format'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '43. ValidateFormatString for format: 書式指定子: xx',
        Expect<ValidateFormatString<`xx`, 'format'>, ToEqual<ValidationSuccess>>
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
            ToEqual<ValidationFailure<"書式指定子がありません: 'yyyy-MM-dd'">>
        >
    >,
    ...It<
        '6. ValidateFormatString for parse: 無効な書式指定子です',
        Expect<
            ValidateFormatString<'yyy-MM-dd', 'parse'>,
            ToEqual<ValidationFailure<'無効な書式指定子です: yyy: yyy-MM-dd'>>
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
        Expect<ValidateFormatString<`yy`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '11. ValidateFormatString for parse: 書式指定子: M',
        Expect<ValidateFormatString<`M`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '12. ValidateFormatString for parse: 書式指定子: MM',
        Expect<ValidateFormatString<`MM`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '13. ValidateFormatString for parse: 書式指定子: MMM',
        Expect<ValidateFormatString<`MMM`, 'parse'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`d`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '16. ValidateFormatString for parse: 書式指定子: dd',
        Expect<ValidateFormatString<`dd`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '17. ValidateFormatString for parse: 書式指定子: H',
        Expect<ValidateFormatString<`H`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '18. ValidateFormatString for parse: 書式指定子: HH',
        Expect<ValidateFormatString<`HH`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '19. ValidateFormatString for parse: 書式指定子: h',
        Expect<ValidateFormatString<`h a`, 'parse'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`a h`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '22. ValidateFormatString for parse: 書式指定子: m',
        Expect<ValidateFormatString<`m`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '23. ValidateFormatString for parse: 書式指定子: mm',
        Expect<ValidateFormatString<`mm`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '24. ValidateFormatString for parse: 書式指定子: s',
        Expect<ValidateFormatString<`s`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '25. ValidateFormatString for parse: 書式指定子: ss',
        Expect<ValidateFormatString<`ss`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '26. ValidateFormatString for parse: 書式指定子: S',
        Expect<ValidateFormatString<`S`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '27. ValidateFormatString for parse: 書式指定子: SS',
        Expect<ValidateFormatString<`SS`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '28. ValidateFormatString for parse: 書式指定子: SSS',
        Expect<ValidateFormatString<`SSS`, 'parse'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`dE`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '36. ValidateFormatString for parse: 書式指定子: EE',
        Expect<ValidateFormatString<`dEE`, 'parse'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`dX`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '40. ValidateFormatString for parse: 書式指定子: XX',
        Expect<ValidateFormatString<`dXX`, 'parse'>, ToEqual<ValidationSuccess>>
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
        Expect<ValidateFormatString<`dx`, 'parse'>, ToEqual<ValidationSuccess>>
    >,
    ...It<
        '43. ValidateFormatString for parse: 書式指定子: xx',
        Expect<ValidateFormatString<`dxx`, 'parse'>, ToEqual<ValidationSuccess>>
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
            ValidateFormatString<`E EE EEE EEEE X XX XXX x xx xxx`, 'parse'>,
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
];

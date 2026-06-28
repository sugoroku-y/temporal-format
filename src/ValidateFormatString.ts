import type { DateTimeProperties, PropertyMap } from './constants';
import type { Alphabet, FailoverIfNever, NonNullish } from './types';

/** 書式指定のノード */
export type TokenNode<Token extends string = string> = [Token];
/** リテラル文字列のノード */
export type LiteralNode<Literal extends string = string> = Literal;

/** 書式文字列を解析した結果(成功時) */
type SuccessResult<
    Node extends TokenNode | LiteralNode = TokenNode | LiteralNode,
> = Node[];
/** 解析結果(失敗時) */
export interface FailureResult<Message extends string = string> {
    error: Message;
}
type ParseResult = SuccessResult | FailureResult;

export type AddToken<R extends SuccessResult, Token extends Alphabet> =
    // 最後のNodeが同じ文字の書式指定子なら
    R extends [...infer Pre, TokenNode<infer Last extends `${string}${Token}`>]
        ? // 最後のNodeに1文字加える
          [...Pre, TokenNode<`${Last}${Token}`>]
        : // でなければ新しいNodeを追加
          [...R, TokenNode<Token>];
export type AddLiteral<R extends SuccessResult, Literal extends string> =
    // 最後のNodeがリテラル文字列なら
    R extends [...infer Pre, LiteralNode<infer Last>]
        ? // 最後のリテラル文字列に追加
          [...Pre, LiteralNode<`${Last}${Literal}`>]
        : // でなければ新しいNodeを追加
          [...R, LiteralNode<Literal>];

/** 書式文字列を解析 */
export type ParseFormatString<S extends string, R extends SuccessResult = []> =
    // 先頭の1文字を抽出
    S extends `${infer First}${infer Rest}`
        ? // 先頭の1文字が引用符
          First extends "'" | '"'
            ? // その次も引用符
              Rest extends `${First}${infer Rest2}`
                ? // リテラル文字列として引用符1文字を追加して続行
                  ParseFormatString<Rest2, AddLiteral<R, First>>
                : // 引用符1文字だけならクォートしたリテラル文字列の始まり
                  ParseQuotedLiteral<Rest, First, R>
            : // 引用符以外は解析続行
              ParseFormatString<
                  Rest,
                  // 先頭がアルファベット
                  First extends Alphabet
                      ? // 書式指定子として追加
                        AddToken<R, First>
                      : // 先頭がその他の文字ならリテラル文字列として追加
                        AddLiteral<R, First>
              >
        : // もう文字がなければ現在の結果を返す
          R;

/** 書式文字列中の引用符内を解析 */
type ParseQuotedLiteral<
    S extends string,
    Q extends "'" | '"',
    R extends SuccessResult,
> =
    // 先頭の1文字を抽出
    S extends `${infer First}${infer Rest}`
        ? // 先頭の1文字が引用符
          First extends "'" | '"'
            ? // 次の文字も引用符
              Rest extends `${First}${infer Rest2}`
                ? // リテラル文字列として引用符1文字を追加して続行
                  ParseQuotedLiteral<Rest2, Q, AddLiteral<R, First>>
                : // 開始した引用符と同じ引用符1文字だったなら
                  First extends Q
                  ? // リテラル文字列として引用符までの文字列を追加して書式指定子解析に戻る
                    ParseFormatString<Rest, R>
                  : // 開始したものとは違う引用符が単独出会った場合はエラー
                    FailureResult<`単独の引用符${First}が使われています`>
            : ParseQuotedLiteral<Rest, Q, AddLiteral<R, First>>
        : // 引用符が見つからなければエラー
          FailureResult<'引用符が閉じられていません'>;

type ExtractToken<R extends ParseResult> =
    R extends SuccessResult<infer Parsed extends TokenNode | LiteralNode>
        ? FailoverIfNever<
              Parsed extends TokenNode<infer Token> ? Token : never,
              ['no-token']
          >
        : ['failure'];

/** 書式文字列の検証で問題がなかったとき */
export type ValidationSuccess = [];
/** 書式文字列の検証で問題があったとき */
export type ValidationFailure<Message extends string> = [] & {
    message: Message;
};

/**
 * 書式文字列の解析に失敗した場合はそのエラーメッセージを返す型関数
 *
 * 成功していればundefinedを返す
 *
 * neverではなくundefinedなのはextendsで判定可能にするため
 * @template R ParseFormatStringの返り値
 */
type ValidateParsingSuccessfull<R extends ParseResult> =
    // 解析に失敗
    R extends FailureResult<infer Message extends string>
        ? // エラーメッセージを返す
          Message
        : // 成功していればundefinedを返す
          never;

/**
 * 書式文字列中に書式指定子がない場合はエラーメッセージを返す型関数
 *
 * ある場合はundefinedを返す
 *
 * ParseFailureがundefinedを返したあとに呼び出される
 * @template R ParseFormatStringの返り値
 *
 * 定義としてはFailureResultとのUnion型になっているが、実際にはSuccessResultになっている
 */
type ValidateTokenExistence<R extends ParseResult> =
    ExtractToken<R> extends ['no-token'] ? '書式指定子がありません' : never;

/**
 * 無効な書式指定子が指定されていればエラーメッセージを返す型関数
 *
 * 有効な書式指定子だけであればundefinedを返す
 *
 * ParseFailure、NoTokenがundefinedを返したあとに呼び出される
 * @template R ParseFormatStringの返り値
 *
 * 定義としてはFailureResultとのUnion型になっているが、実際の型には以下の前提がある。
 *
 * - SuccessResultである
 * - TokenNodeが含まれている
 */
type ValidateTokenSupported<R extends ParseResult> =
    // 解析結果から書式指定子を抽出してTokenに割当
    ExtractToken<R> extends infer Token extends string
        ? // 無効な書式指定子を抽出してメッセージを生成して返す(Tokenがすべて有効ならneverになる)
          `無効な書式指定子です: ${Exclude<Token, keyof PropertyMap>}`
        : // 前提条件からここには来ない
          never;

/**
 * 日付や時刻の書式指定子がなければエラーメッセージを返す型関数
 *
 * あればundefinedを返す
 *
 * ParseFailure、NoToken、UnsupportedTokenがundefinedを返したあとに呼び出される
 * @template R ParseFormatStringの返り値
 *
 * いくつかの型関数が呼ばれundefinedを返したあとに呼ばれるため、実際の型には以下の前提がある。
 *
 * - SuccessResult
 * - TokenNodeが含まれている
 * - すべてのTokenNodeの書式指定子はPropertyMapのキーになっている
 */
type ValidateDateTimeTokenExistence<R extends ParseResult> =
    // 解析結果から書式指定子を抽出してTokenに割当
    ExtractToken<R> extends infer Token extends keyof PropertyMap
        ? // 日付や時刻のプロパティだけを抽出し、それが空なら
          [Extract<PropertyMap[Token][number], DateTimeProperties>] extends [never]
            ? // エラーメッセージを返す
              '日付や時刻の書式指定子がありません'
            : // 日付や時刻のプロパティがあればundefined
              never
        : // 前提条件からここには来ない
          never;

/**
 * 午前午後の書式指定子と12時間制の時間の書式指定子がどちらか一方だけ指定されていればエラーメッセージを返す型関数
 *
 * どちらも指定されていない、もしくは両方指定されていればundefinedを返す
 * @template R ParseFormatStringの返り値
 *
 * いくつかの型関数が呼ばれundefinedを返したあとに呼ばれるため、実際の型には以下の前提がある。
 *
 * - SuccessResult
 * - TokenNodeが含まれている
 * - すべてのTokenNodeの書式指定子はPropertyMapのキーになっている
 */
type ValidateDayPeriodAnd12Hours<R extends ParseResult> =
    ExtractToken<R> extends infer Token extends keyof PropertyMap
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
              [Extract<Token, 'a'>] extends [never] ? '_' : 'a'
          }${
              // h/hhが含まれていれば`'h'`、なければ`'_'`
              [Extract<Token, 'h' | 'hh'>] extends [never] ? '_' : 'h'
          }`]
        : // 前提条件からここには来ない
          never;

/** 書式文字列の利用目的 */
type Purpose = 'format' | 'parse';

/**
 * 書式文字列を解析して問題があればエラーメッセージを返す型関数
 *
 * 問題がなければundefinedを返す。
 */
type ValidationMessage<R extends ParseResult, P extends Purpose> =
    // 書式文字列の解析に成功
    | ValidateParsingSuccessfull<R>
    // 書式指定子が存在する
    | ValidateTokenExistence<R>
    // 書式指定子が有効
    | ValidateTokenSupported<R>
    // formatの場合
    | (P extends 'format'
          ? // 検証はここまで
            never
          : // parseの場合
            P extends 'parse'
            ? // 日付や時刻の書式指定子を含む
                  | ValidateDateTimeTokenExistence<R>
                  // 午前午後と12時間制の時間は同時に使用
                  | ValidateDayPeriodAnd12Hours<R>
            : // formatでもparseでもない、ことはないのでここには来ない
              never);

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
    // SをUnion展開
    S extends S
        ? // Sが文字列リテラル型でなければ
          NonNullish extends Record<S, never>
            ? // 解析できないので検証成功とみなす
              ValidationSuccess
            : // 検証結果をMessageに割当
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

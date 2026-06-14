import type { DateTimeProperties, PropertyMap } from './constants';
import type { Alphabet } from './types';

export type FormatToken<Unit extends string = string> = [Unit];
export type LiteralToken<Literal extends string = string> = Literal;
export interface ErrorToken<Message extends string = string> {
    error: Message;
}
type Token = FormatToken | LiteralToken | ErrorToken;
type ParseFormatStringContext = Token[];

export type AddFormatToken<
    Unit extends string,
    Context extends ParseFormatStringContext,
> = Context extends [
    ...infer Pre,
    FormatToken<infer LastUnit extends `${string}${Unit}`>,
]
    ? [...Pre, FormatToken<`${LastUnit}${Unit}`>]
    : [...Context, FormatToken<Unit>];
export type AddLiteralToken<
    Literal extends string,
    Context extends ParseFormatStringContext,
> = Context extends [...infer Pre, LiteralToken<infer LastLiteral>]
    ? [...Pre, LiteralToken<`${LastLiteral}${Literal}`>]
    : [...Context, LiteralToken<Literal>];
export type AddErrorToken<
    Message extends string,
    Context extends ParseFormatStringContext,
> = [...Context, ErrorToken<Message>];

export type ParseFormatString<
    S extends string,
    Context extends ParseFormatStringContext = [],
> = S extends `''${infer Rest}`
    ? ParseFormatString<Rest, AddLiteralToken<"'", Context>>
    : S extends `'${infer Rest}`
      ? ParseLiteral<Rest, Context>
      : S extends `${infer Unit extends Alphabet}${infer Rest}`
        ? ParseFormatString<Rest, AddFormatToken<Unit, Context>>
        : S extends `${infer Literal}${infer Rest}`
          ? ParseFormatString<Rest, AddLiteralToken<Literal, Context>>
          : Context;

type ParseLiteral<
    S extends string,
    Context extends ParseFormatStringContext,
> = S extends `${infer Literal}''${infer Rest}`
    ? ParseLiteral<Rest, AddLiteralToken<`${Literal}'`, Context>>
    : S extends `${infer Literal}'${infer Rest}`
      ? ParseFormatString<Rest, AddLiteralToken<Literal, Context>>
      : AddErrorToken<
            `引用符が閉じられていません: ${Context extends [
                ...Token[],
                infer LastLiteral extends LiteralToken,
            ]
                ? LastLiteral
                : ''}'${S}`,
            Context
        >;

export interface ErrorResult<Message extends string> {
    message: Message;
}

type ValidationForError<Context extends ParseFormatStringContext> =
    // ErrorTokenを抽出してEに割当
    Extract<Context[number], ErrorToken> extends infer E extends ErrorToken
        ? [E] extends [never]
            ? // Eがなければエラーなし
              never
            : // Eが存在したら、そのエラーを返す
              E extends ErrorToken<infer Message>
              ? // ContextにErrorTokenが含まれていれば、そのエラーを返す
                Message
              : // Messageへの割当のためのextendsなのでこちらには来ない
                never
        : // Eへの割当のためのextendsなのでここには来ない
          never;
type ValidateUnit<Unit extends string> =
    // UnitをUnion展開
    Unit extends Unit
        ? // Unitが5文字以上の場合
          Unit extends `${infer _}${infer _}${infer _}${infer _}${infer _}${string}`
            ? // エラーを返す
              `5文字以上の書式文字列はサポートされていません: ${Unit}`
            : // Unitが有効な書式文字列の場合
              Unit extends keyof PropertyMap
              ? // エラーなし
                never
              : // 無効な場合はエラーを返す
                `無効な書式文字列です: ${Unit}`
        : // UnitのUnion展開のためのextendsなのでこちらには来ない
          never;
type ValidateUnitForParse<Unit extends string, Result> =
    // 前段階の結果がエラーなしだった場合
    [Result] extends [never]
        ? // 各書式文字列で使用するプロパティに日付時刻のものが含まれていなかった場合
          [
              Extract<
                  PropertyMap[Extract<Unit, keyof PropertyMap>],
                  DateTimeProperties
              >,
          ] extends [never]
            ? // parseでは日付か時刻の書式が必須
              '日付か時刻の書式文字列がありません'
            : // parseでは午前午後と12時間制表記を一緒に使う必要がある
              {
                  // どちらも使用していないならOK
                  '': never;
                  // どちらも使用しているでもOK
                  AH: never;
                  // 午前午後だけ使用している場合はエラー
                  A: '午前/午後(a)がある場合、12時間表記(h/hh)も必要です';
                  // 12時間表記だけ使用している場合もエラー
                  H: '12時間表記(h/hh)がある場合、午前/午後(a)も必要です';
              }[ // 午前午後と12時間制表記の組み合わせをチェック
              `${[Extract<Unit, 'a'>] extends [never] ? '' : 'A'}${[Extract<Unit, 'h' | 'hh'>] extends [never] ? '' : 'H'}`]
        : // 前段階でエラーがあればそのまま返す
          Result;

type ValidationErrorMessage<
    Context extends ParseFormatStringContext,
    Purpose extends 'format' | 'parse',
    Result,
> =
    // 前段階で結果が出ていなければ続行
    [Result] extends [never]
        ? // FormatTokenを抽出してFに割当
          Extract<Context[number], FormatToken> extends infer F extends
              FormatToken
            ? // Fがない場合
              [F] extends [never]
                ? // 書式文字列がないのでエラーを返す
                  `書式文字列がありません`
                : // Fが存在したら書式文字列をUnitに割当
                  [F] extends [FormatToken<infer Unit extends string>]
                  ? // 書式文字列のバリデーション
                    {
                        format: ValidateUnit<Unit>;
                        parse: ValidateUnitForParse<Unit, ValidateUnit<Unit>>;
                    }[Purpose]
                  : // Unitへの割当のためのextendsなのでこちらには来ない
                    never
            : // Fへの割当のためのextendsなのでこちらには来ない
              never
        : // 結果が出ていればそのまま返す
          Result;
type ValidateFormatStringBase<
    Context extends ParseFormatStringContext,
    Purpose extends 'format' | 'parse',
> = ValidationErrorMessage<Context, Purpose, ValidationForError<Context>>;

type ValidationResult<
    S extends string,
    Purpose extends 'format' | 'parse',
> = S extends S // SをUnion展開
    ? ValidateFormatStringBase<
          // Sの解析結果をContextとして割当
          ParseFormatString<S>,
          Purpose
      >
    : // SをUnion展開するためのextendsなのでここには来ない
      never;

export type ValidateFormatString<
    S extends string,
    Purpose extends 'format' | 'parse',
> =
    // Sがstringそのものの場合
    string extends S
        ? // 書式文字列の解析はできないのでエラーなしとする
          []
        : // SがstringでないならparseしてValidation
          ValidationResult<S, Purpose> extends infer Message extends string
          ? [Message] extends [never]
              ? []
              : [] & { message: `${Message}: ${S}` }
          : never;

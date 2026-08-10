type FormatTarget = Temporal.ZonedDateTime | Temporal.PlainDateTime | Temporal.PlainDate | Temporal.PlainTime | Temporal.PlainYearMonth | Temporal.PlainMonthDay;
type Split<S extends string> = S extends `${infer First}${infer Rest}` ? First | Split<Rest> : never;
type UppercaseAlphabet = Split<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>;
type LowercaseAlphabet = Lowercase<UppercaseAlphabet>;
/** アルファベット1文字の文字列リテラル型 */
type Alphabet = UppercaseAlphabet | LowercaseAlphabet;
/**
 * `{}`型はeslintで警告されるため別名を用意
 */
type NonNullish = Record<never, never>;
/**
 * TがneverならばFallbackにする
 */
type FailoverIfNever<T, Fallback> = [T] extends [never] ? Fallback : T;
type Counter<N extends number, R extends 1[] = []> = R['length'] extends N ? R : Counter<N, [1, ...R]>;
/**
 * 数を1つ増やす
 */
type Increment<N extends number> = Extract<[...Counter<N>, 1]['length'], number>;
type RepeatSub<S extends string, N extends number, R extends string, C extends 1[]> = C['length'] extends N ? R : RepeatSub<S, N, `${R}${S}`, [1, ...C]>;
/**
 * 文字列リテラル型を指定回数繰り返した文字列リテラル型を返す型関数
 *
 * S、N。いずれもUnion型を指定するとそれぞれの型で繰り返したUnion型となる。
 * @template S 文字列リテラル型
 * @template N 繰り返す回数
 */
type Repeat<S extends string, N extends number> = S extends S ? N extends N ? RepeatSub<S, N, '', []> : never : never;
type StrictRecord<Key extends PropertyKey, Value> = [Key] extends [never] ? Partial<Record<PropertyKey, never>> : Record<Key, Value>;
type TemplateType = (string | [string])[];
type AddToken$1<Template extends TemplateType, Token extends string> = [...Template, [Token]];
type AddLiteral$1<Template extends TemplateType, Literal extends string> = Template extends [...infer Pre, infer Last extends string] ? [...Pre, `${Last}${Literal}`] : [...Template, Literal];
type ParseTemplate<S extends string, Result extends TemplateType = []> = S extends `${infer First}${infer Post}` ? First extends '$' ? Post extends `${First}${infer Post2}` ? ParseTemplate<Post2, AddLiteral$1<Result, First>> : Post extends `{${infer Token}}${infer Post2}` ? ParseTemplate<Post2, AddToken$1<Result, Token>> : ParseTemplate<Post, AddLiteral$1<Result, First>> : ParseTemplate<Post, AddLiteral$1<Result, First>> : Result;
type TemplateTypeToParameterType<Template extends TemplateType> = StrictRecord<Extract<Template[number], [string]>[0], string | number>;
type TemplateParameter<S extends string> = TemplateTypeToParameterType<ParseTemplate<S>>;
type ApplyTemplate<Template extends TemplateType, Parameters extends Partial<Record<string, string | number>>> = Template extends [infer First, ...infer Post extends TemplateType] ? `${First extends string ? First : First extends [infer Token] ? Token extends keyof Parameters ? Parameters[Token] : '' : never}${ApplyTemplate<Post, Parameters>}` : '';
type ExpandTemplate<S extends string, Parameters extends TemplateParameter<S> = TemplateParameter<S>> = ApplyTemplate<ParseTemplate<S>, Parameters>;
declare const messages$2: {
  readonly unsupportedLocale: "Unsupported locale: ${locale}";
  readonly unsupportedCalendarId: "Unsupported calendar: ${calendarId}";
  readonly invalidMonthCode: "Unexpected monthCode: ${monthCode}";
  readonly unsupportedOverflow: "Unsupported overflow behavior: ${overflow}";
  readonly unclosedQuote: "The quote ${quote} is not closed";
  readonly independentQuote: "An alone quote ${quote} is used";
  readonly noFormatToken: "There is no format token";
  readonly invalidFormatToken: "Invalid format token: ${token}";
  readonly noProperty: "${instance} does not have property ${property}: ${token}";
  readonly noMethod: "${instance} does not have method ${method}";
  readonly noDateTimeToken: "There is no date or time format token";
  readonly required12hoursWhenUsingAmPm: "When using AM/PM token (a), 12-hour token (h/hh) is also required";
  readonly dontUseBoth12hoursAnd24Hours: "You cannot specify both 12-hour token (h/hh) and 24-hour token (H/HH)";
  readonly requiredAmPmWhenUsing12hours: "When using 12-hour token (h/hh), AM/PM token (a) is also required";
  readonly duplicateFormatToken: "Duplicate format token: ${token}";
};
declare const messages$1: {
  /** サポートしていないロケール */
  readonly unsupportedLocale: "サポートしていないロケール: ${locale}";
  readonly unsupportedCalendarId: "対応していないカレンダーです: ${calendarId}";
  readonly invalidMonthCode: "想定外のmonthCodeです: ${monthCode}";
  readonly unsupportedOverflow: "サポートしていないオーバーフローの挙動: ${overflow}";
  readonly noProperty: "${instance}にはプロパティ${property}がありません: ${token}";
  readonly noMethod: "${instance}にはメソッド${method}がありません";
  readonly unclosedQuote: "引用符${quote}が閉じられていません";
  readonly independentQuote: "単独の引用符${quote}が使われています";
  readonly noFormatToken: "書式指定子がありません";
  readonly invalidFormatToken: "無効な書式指定子です: ${token}";
  readonly noDateTimeToken: "日付や時刻の書式指定子がありません";
  readonly required12hoursWhenUsingAmPm: "午前/午後(a)がある場合、12時間表記(h/hh)も必要です";
  readonly dontUseBoth12hoursAnd24Hours: "12時間表記(h/hh)と24時間表記(H/HH)の両方を指定することはできません";
  readonly requiredAmPmWhenUsing12hours: "12時間表記(h/hh)がある場合、午前/午後(a)も必要です";
  readonly duplicateFormatToken: "書式指定子が重複しています: ${token}";
};
declare const messages: typeof process.env.TEMPORAL_FORMAT_LANG extends "ja" ? typeof messages$1 : typeof messages$2;
/** 書式指定のノード */
type TokenNode<Char extends string = string, Length extends number = number> = [Char, Length];
/** リテラル文字列のノード */
type LiteralNode<Literal extends string = string> = Literal;
/** 書式文字列を解析した結果(成功時) */
type SuccessResult<Node extends TokenNode | LiteralNode = TokenNode | LiteralNode> = Node[];
/** 解析結果(失敗時) */
interface FailureResult<Message extends string = string> {
  error: Message;
}
type ParseResult = SuccessResult | FailureResult;
type AddToken<R extends SuccessResult, Char extends Alphabet> = R extends [...infer Pre, TokenNode<Char, infer Last extends number>] ? [...Pre, TokenNode<Char, Increment<Last>>] : [...R, TokenNode<Char, 1>];
type AddLiteral<R extends SuccessResult, Literal extends string> = R extends [...infer Pre, LiteralNode<infer Last>] ? [...Pre, LiteralNode<`${Last}${Literal}`>] : [...R, LiteralNode<Literal>];
/** 書式文字列を解析 */
type ParseFormatString<S extends string, R extends SuccessResult = []> = S extends `${infer First}${infer Rest}` ? First extends "'" | '"' ? Rest extends `${First}${infer Rest2}` ? ParseFormatString<Rest2, AddLiteral<R, First>> : ParseQuotedLiteral<Rest, First, R> : ParseFormatString<Rest, First extends Alphabet ? AddToken<R, First> : AddLiteral<R, First>> : R;
/** 書式文字列中の引用符内を解析 */
type ParseQuotedLiteral<S extends string, Q extends "'" | '"', R extends SuccessResult> = S extends `${infer First}${infer Rest}` ? First extends "'" | '"' ? Rest extends `${First}${infer Rest2}` ? ParseQuotedLiteral<Rest2, Q, AddLiteral<R, First>> : First extends Q ? ParseFormatString<Rest, R> : FailureResult<ExpandTemplate<typeof messages.independentQuote, {
  quote: First;
}>> : ParseQuotedLiteral<Rest, Q, AddLiteral<R, First>> : FailureResult<ExpandTemplate<typeof messages.unclosedQuote, {
  quote: Q;
}>>;
type ExtractToken<R extends ParseResult> = R extends SuccessResult<infer Parsed extends TokenNode | LiteralNode> ? FailoverIfNever<Extract<Parsed, TokenNode>, ['no-token']> : ['failure'];
declare const FORMAT_TOKEN_MAP: {
  readonly y: {
    readonly length: [2, 4];
    readonly properties: ["year"];
  };
  readonly M: {
    readonly length: [1, 2, 3, 4];
    readonly properties: ["monthCode"];
  };
  readonly d: {
    readonly length: [1, 2];
    readonly properties: ["day"];
  };
  readonly E: {
    readonly length: [1, 2, 3, 4];
    readonly properties: ["dayOfWeek"];
  };
  readonly a: {
    readonly length: [1];
    readonly properties: ["hour"];
  };
  readonly H: {
    readonly length: [1, 2];
    readonly properties: ["hour"];
  };
  readonly h: {
    readonly length: [1, 2];
    readonly properties: ["hour"];
  };
  readonly m: {
    readonly length: [1, 2];
    readonly properties: ["minute"];
  };
  readonly s: {
    readonly length: [1, 2];
    readonly properties: ["second"];
  };
  readonly S: {
    readonly length: [1, 2, 3, 4, 5, 6, 7, 8, 9];
    readonly properties: ["millisecond", "microsecond", "nanosecond"];
  };
  readonly X: {
    readonly length: [1, 2, 3];
    readonly properties: ["offset"];
  };
  readonly x: {
    readonly length: [1, 2, 3];
    readonly properties: ["offset"];
  };
};
type FormatTokenMap = typeof FORMAT_TOKEN_MAP;
type StrictTokenNode = { [Char in keyof FormatTokenMap]: { [Length in FormatTokenMap[Char]['length'][number]]: TokenNode<Char, Length>; }[FormatTokenMap[Char]['length'][number]]; }[keyof FormatTokenMap];
type IsSupportedToken<Token extends TokenNode> = Token extends StrictTokenNode ? true : false;
/** 特定のプロパティを使う書式指定子のみを抽出する型関数 */
type FilteredToken<Properties extends FormatTokenMap[keyof FormatTokenMap]['properties'][number]> = keyof { [Char in keyof FormatTokenMap as FormatTokenMap[Char]['properties'][number] extends Properties ? Char : never]: 1; };
declare const LOCALES: {
  readonly 'en-US': {
    readonly month: {
      readonly short: {
        readonly M01: "Jan";
        readonly M02: "Feb";
        readonly M03: "Mar";
        readonly M04: "Apr";
        readonly M05: "May";
        readonly M06: "Jun";
        readonly M07: "Jul";
        readonly M08: "Aug";
        readonly M09: "Sep";
        readonly M10: "Oct";
        readonly M11: "Nov";
        readonly M12: "Dec";
      };
      readonly long: {
        readonly M01: "January";
        readonly M02: "February";
        readonly M03: "March";
        readonly M04: "April";
        readonly M05: "May";
        readonly M06: "June";
        readonly M07: "July";
        readonly M08: "August";
        readonly M09: "September";
        readonly M10: "October";
        readonly M11: "November";
        readonly M12: "December";
      };
    };
    readonly dayOfWeek: {
      readonly short: readonly ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      readonly long: readonly ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    };
    readonly dayPeriod: {
      readonly amPm: readonly ["AM", "PM"];
    };
  };
  readonly 'ja-JP': {
    readonly month: {
      readonly short: {
        readonly M01: "1月";
        readonly M02: "2月";
        readonly M03: "3月";
        readonly M04: "4月";
        readonly M05: "5月";
        readonly M06: "6月";
        readonly M07: "7月";
        readonly M08: "8月";
        readonly M09: "9月";
        readonly M10: "10月";
        readonly M11: "11月";
        readonly M12: "12月";
      };
      readonly long: {
        readonly M01: "1月";
        readonly M02: "2月";
        readonly M03: "3月";
        readonly M04: "4月";
        readonly M05: "5月";
        readonly M06: "6月";
        readonly M07: "7月";
        readonly M08: "8月";
        readonly M09: "9月";
        readonly M10: "10月";
        readonly M11: "11月";
        readonly M12: "12月";
      };
    };
    readonly dayOfWeek: {
      readonly short: readonly ["月", "火", "水", "木", "金", "土", "日"];
      readonly long: readonly ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"];
    };
    readonly dayPeriod: {
      readonly amPm: readonly ["午前", "午後"];
    };
  };
};
/**
 * 整形/解析で使用するロケール
 *
 * 以下のものが使用できます。
 *
 * - `en-US` 英語(デフォルト)
 *
 *   以下の文字列が使用されます。
 *
 *   | 書式指定子       | 結果                  |
 *   |------------------|-----------------------|
 *   | `MMM`            | `Jan`〜`Dec`          |
 *   | `MMMM`           | `January`〜`December` |
 *   | `E`, `EE`, `EEE` | `Mon`〜`Sun`          |
 *   | `EEEE`           | `Monday`〜`Sunday`    |
 *   | `a`              | `AM`, `PM`            |
 *
 * - `ja-JP` 日本語
 *
 *   以下の文字列が使用されます。
 *
 *   | 書式指定子       | 結果                |
 *   |------------------|---------------------|
 *   | `MMM`, `MMMM`    | `1月`〜`12月`       |
 *   | `E`, `EE`, `EEE` | `月`〜`日`          |
 *   | `EEEE`           | `月曜日`〜`日曜日`  |
 *   | `a`              | `午前`, `午後`      |
 *
 * 上記以外を指定するとエラーになります。
 */
type Locale = keyof typeof LOCALES;
type WithValue = Omit<FormatTarget['with'] extends ((_: infer R) => unknown) ? R : never, 'era' | 'eraYear' | 'offset' | 'month'>;
type DateTimeProperties = keyof WithValue;
type DateTimeToken = FilteredToken<DateTimeProperties>;
type RequiredProperties<S extends string> = S extends S ? ParseFormatString<S> extends SuccessResult<infer Parsed> ? FormatTokenMap[Extract<Extract<Parsed, TokenNode>[0], keyof FormatTokenMap>]['properties'][number] : never : never;
type TargetForSub<Properties extends FormatTokenMap[keyof FormatTokenMap]['properties'][number]> = [Properties] extends [never] ? FormatTarget : Pick<Temporal.ZonedDateTime, Properties>;
type ReferenceForSub<Properties extends FormatTokenMap[keyof FormatTokenMap]['properties'][number]> = TargetForSub<Properties> & {
  with(like: TargetForSub<Exclude<Properties, 'dayOfWeek' | 'offset'>>): unknown;
} & ('offset' extends Properties ? Pick<Temporal.ZonedDateTime, 'withTimeZone'> : NonNullish);
/**
 * formatで指定された書式文字列に対してtargetに指定できるインスタンスの型を生成する型関数
 *
 * 書式指定子に対応するプロパティを持つオブジェクト型を返す。
 */
type TargetFor<S extends string> = NonNullish extends Record<S, never> ? FormatTarget : TargetForSub<RequiredProperties<S>>;
/**
 * parseで指定された書式文字列に対してreferenceに指定できるインスタンスの型を生成する型関数
 *
 * 書式指定子に対応するプロパティとwithメソッド、及び必要ならwithTimeZoneメソッドを持つオブジェクト型を返す。
 *
 */
type ReferenceFor<S extends string> = NonNullish extends Record<S, never> ? FormatTarget : ReferenceForSub<RequiredProperties<S>>;
/** 書式文字列の検証で問題がなかったとき */
type ValidationSuccess = [];
/** 書式文字列の検証で問題があったとき */
type ValidationFailure<Message extends string> = [] & {
  message: Message;
};
/**
 * 書式文字列の解析に失敗した場合はそのエラーメッセージを返す型関数
 *
 * 成功していればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateParsingSuccessfull<R extends ParseResult> = R extends FailureResult<infer Message extends string> ? Message : never;
/**
 * 書式文字列中に書式指定子がない場合はエラーメッセージを返す型関数
 *
 * ある場合はneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateTokenExistence<R extends ParseResult> = ExtractToken<R> extends ['no-token'] ? typeof messages.noFormatToken : never;
/**
 * 無効な書式指定子が指定されていればエラーメッセージを返す型関数
 *
 * 有効な書式指定子だけであればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateTokenSupported<R extends ParseResult> = ExtractToken<R> extends (infer Token extends TokenNode) ? Token extends Token ? IsSupportedToken<Token> extends false ? ExpandTemplate<typeof messages.invalidFormatToken, {
  token: Repeat<Token[0], Token[1]>;
}> : never : never : never;
/**
 * 日付や時刻の書式指定子がなければエラーメッセージを返す型関数
 *
 * あればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateDateTimeTokenExistence<R extends ParseResult> = ExtractToken<R> extends (infer Token extends TokenNode) ? [Extract<Token, TokenNode<DateTimeToken>>] extends [never] ? typeof messages.noDateTimeToken : never : never;
/**
 * 午前午後の書式指定子と12時間制の時間の書式指定子がどちらか一方だけ指定されていればエラーメッセージを返す型関数
 *
 * どちらも指定されていない、もしくは両方指定されていればneverを返す
 * @template R ParseFormatStringの返り値
 */
type ValidateDayPeriodAnd12Hours<R extends ParseResult> = ExtractToken<R> extends (infer Token extends TokenNode) ? {
  __: never;
  ah: [Extract<Token[0], 'H'>] extends [never] ? never : typeof messages.dontUseBoth12hoursAnd24Hours;
  a_: typeof messages.required12hoursWhenUsingAmPm;
  _h: typeof messages.requiredAmPmWhenUsing12hours;
}[`${FailoverIfNever<Extract<Token[0], 'a'>, '_'>}${FailoverIfNever<Extract<Token[0], 'h'>, '_'>}`] : never;
type ValidateNoDuplicateToken<R extends ParseResult> = R extends [infer First, ...infer Rest extends SuccessResult] ? First extends TokenNode ? [Extract<Rest[number], TokenNode<First[0]>>] extends [never] ? ValidateNoDuplicateToken<Rest> : ExpandTemplate<typeof messages.duplicateFormatToken, {
  token: Repeat<First[0], First[1]>;
}> : ValidateNoDuplicateToken<Rest> : never;
/** 書式文字列の利用目的 */
type Purpose = 'format' | 'parse';
/**
 * 書式文字列を解析して問題があればエラーメッセージを返す型関数
 *
 * 問題がなければneverを返す。
 */
type ValidationMessage<R extends ParseResult, P extends Purpose> = ValidateParsingSuccessfull<R> | ValidateTokenExistence<R> | ValidateTokenSupported<R> | {
  format: never;
  parse: ValidateDateTimeTokenExistence<R> | ValidateDayPeriodAnd12Hours<R> | ValidateNoDuplicateToken<R>;
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
type ValidateFormatString<S extends string, P extends Purpose> = NonNullish extends Record<S, never> ? ValidationSuccess : S extends S ? ValidationMessage<ParseFormatString<S>, P> extends (infer Message extends string) ? [Message] extends [never] ? ValidationSuccess : ValidationFailure<`${Message}: ${S}`> : never : never;
/**
 * 整形のためのオプション
 */
interface FormatOptions {
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
declare function format<F extends string>(target: TargetFor<F>, formatString: F, options?: FormatOptions, ..._: ValidateFormatString<F, 'format'>): string;
/**
 * 書式文字列は同じアルファベットが1文字以上連続する書式指定子と、リテラル文字列で構成されます。
 *
 * アルファベットをリテラル文字列として使う場合には、引用符(`'`もしくは`"`)で囲んでください。
 *
 * 引用符をリテラル文字列として使う場合には、引用符を2文字(`''`もしくは`""`)重ねてください。
 *
 * 書式文字列には必ず1つ以上の書式指定子が必要です。
 *
 * 書式指定子には`FormatString`の各プロパティ名が指定できます。
 *
 * `parse`では日付や時刻の書式指定子を指定する必要があります。
 *
 * `parse`では午前午後の書式指定子(`a`)と12時間制の時間の書式指定子(`h`もしくは`hh`)を同時に指定する必要があります。
 *
 * `parse`では12時間制の時間の書式指定子(`h`もしくは`hh`)と24時間制の時間の書式指定子(`H`もしくは`HH`)を同時に指定することはできません。
 *
 * `parse`では同じアルファベットの書式指定子は1箇所だけ指定してください。
 * @throws
 * 以下の場合にはエラーとなります。
 *
 * - 引用符が閉じられていない
 * - 引用符を単独で使用する
 * - 書式指定子がない
 * - `FormatString`にない書式指定子を使用する
 * - `parse`で曜日(`E`など)やタイムゾーン(`X`など)だけを指定する
 * - `parse`で午前午後の書式指定子(`a`)を指定して、12時間制の時間の書式指定子(`h`もしくは`hh`)を指定しない
 * - `parse`で12時間制の時間の書式指定子(`h`もしくは`hh`)を指定して、午前午後の書式指定子(`a`)を指定しない
 * - `parse`で12時間制の時間の書式指定子(`h`もしくは`hh`)と24時間制の時間の書式指定子(`H`もしくは`HH`)が同時に指定されている
 * - `parse`で同じアルファベットの書式指定子を複数箇所で指定している
 */
declare const FormatString: {
  /**
   * 下2桁の西暦
   *
   * parseではreference.yearにもっとも近い下2桁が一致する年として扱われます。
   *
   * | `reference.year` | 入力文字列 | 結果   |
   * |-----------------:|:----------:|:------:|
   * |             2050 | `00`       | 2000年 |
   * |             2050 | `99`       | 2099年 |
   * |             2025 | `75`       | 1975年 |
   * |             2025 | `74`       | 2074年 |
   * |             2075 | `25`       | 2025年 |
   * |             2075 | `24`       | 2124年 |
   */
  readonly yy: "year";
  /**
   * 桁揃えなしの西暦
   *
   * parseでは4桁の数字を年として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `2000`     | 2000年 |
   * | `2099`     | 2099年 |
   */
  readonly yyyy: "year";
  /**
   * 桁揃えなしの月
   *
   * parseでは1桁、もしくは2桁の数字を月として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `1`        | 1月    |
   * | `12`       | 12月   |
   */
  readonly M: "monthCode";
  /**
   * 桁揃えありの月
   *
   * parseでは2桁の数字を月として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `01`       | 1月    |
   * | `12`       | 12月   |
   */
  readonly MM: "monthCode";
  /**
   * 月名の略称
   *
   * `parse`では`locale`による月名の略称を月として扱います。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `Jan`      | 1月    |
   * | `en-US`  | `Dec`      | 12月   |
   * | `ja-JP`  | `1月`      | 1月    |
   * | `ja-JP`  | `12月`     | 12月   |
   */
  readonly MMM: "monthCode";
  /**
   * 月名
   *
   * `parse`では`locale`による月名を月として扱います。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `January`  | 1月    |
   * | `en-US`  | `December` | 12月   |
   * | `ja-JP`  | `1月`      | 1月    |
   * | `ja-JP`  | `12月`     | 12月   |
   */
  readonly MMMM: "monthCode";
  /**
   * 桁揃えなしの日
   *
   * parseでは1桁、もしくは2桁の数字を日として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `1`        | 1日    |
   * | `31`       | 31日   |
   */
  readonly d: "day";
  /**
   * 桁揃えありの日
   *
   * parseでは2桁の数字を日として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `01`       | 1日    |
   * | `31`       | 31日   |
   */
  readonly dd: "day";
  /**
   * 桁揃えなしの時間(0-23)
   *
   * parseでは1桁、もしくは2桁の数字を時間として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `0`        | 0時    |
   * | `23`       | 23時   |
   */
  readonly H: "hour";
  /**
   * 桁揃えありの時間(00-23)
   *
   * parseでは2桁の数字を時間として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `00`       | 0時    |
   * | `23`       | 23時   |
   */
  readonly HH: "hour";
  /**
   * 桁揃えなしの時間(1-12)
   *
   * parseでは1桁、もしくは2桁の数字を`a`と組み合わせて時間として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `1`        | 1時    |
   * | `12`       | 12時   |
   */
  readonly h: "hour";
  /**
   * 桁揃えありの時間(01-12)
   *
   * parseでは2桁の数字を`a`と組み合わせて時間として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `01`       | 1時    |
   * | `12`       | 12時   |
   */
  readonly hh: "hour";
  /**
   * 午前/午後
   *
   * `parse`では`locale`による午前午後を読み込み、`h`もしくは`hh`と組み合わせて時間として扱います。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `AM`       | 午前   |
   * | `en-US`  | `PM`       | 午後   |
   * | `ja-JP`  | `午前`     | 午前   |
   * | `ja-JP`  | `午後`     | 午後   |
   */
  readonly a: "hour";
  /**
   * 桁揃えなしの分
   *
   * parseでは1桁、もしくは2桁の数字を分として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `0`        | 0分    |
   * | `59`       | 59分   |
   */
  readonly m: "minute";
  /**
   * 桁揃えありの分
   *
   * parseでは2桁の数字を分として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `00`       | 0分    |
   * | `59`       | 59分   |
   */
  readonly mm: "minute";
  /**
   * 桁揃えなしの秒
   *
   * parseでは1桁、もしくは2桁の数字を秒として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `0`        | 0秒    |
   * | `59`       | 59秒   |
   */
  readonly s: "second";
  /**
   * 桁揃えありの秒
   *
   * parseでは2桁の数字を秒として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `00`       | 0秒    |
   * | `59`       | 59秒   |
   */
  readonly ss: "second";
  /**
   * 1桁の小数点以下の秒
   *
   * parseでは1桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `0`        | 0.0秒  |
   * | `9`        | 0.9秒  |
   */
  readonly S: "millisecond";
  /**
   * 2桁の小数点以下の秒
   *
   * parseでは2桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果   |
   * |:----------:|:------:|
   * | `00`       | 0.00秒 |
   * | `99`       | 0.99秒 |
   */
  readonly SS: "millisecond";
  /**
   * 3桁の小数点以下の秒
   *
   * parseでは3桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果    |
   * |:----------:|:-------:|
   * | `000`      | 0.000秒 |
   * | `999`      | 0.999秒 |
   */
  readonly SSS: "millisecond";
  /**
   * 4桁の小数点以下の秒
   *
   * parseでは4桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果      |
   * |:----------:|:---------:|
   * | `0000`     | 0.0000秒  |
   * | `9999`     | 0.9999秒  |
   */
  readonly SSSS: "millisecond";
  /**
   * 5桁の小数点以下の秒
   *
   * parseでは5桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果      |
   * |:----------:|:---------:|
   * | `00000`    | 0.00000秒 |
   * | `99999`    | 0.99999秒 |
   */
  readonly SSSSS: "microsecond";
  /**
   * 6桁の小数点以下の秒
   *
   * parseでは6桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果       |
   * |:----------:|:----------:|
   * | `000000`   | 0.000000秒 |
   * | `999999`   | 0.999999秒 |
   */
  readonly SSSSSS: "microsecond";
  /**
   * 7桁の小数点以下の秒
   *
   * parseでは7桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果        |
   * |:----------:|:-----------:|
   * | `0000000`  | 0.0000000秒 |
   * | `9999999`  | 0.9999999秒 |
   */
  readonly SSSSSSS: "nanosecond";
  /**
   * 8桁の小数点以下の秒
   *
   * parseでは8桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列 | 結果         |
   * |:----------:|:------------:|
   * | `00000000` | 0.00000000秒 |
   * | `99999999` | 0.99999999秒 |
   */
  readonly SSSSSSSS: "nanosecond";
  /**
   * 9桁の小数点以下の秒
   *
   * parseでは9桁の数字を小数点以下の秒として扱います。
   *
   * | 入力文字列  | 結果          |
   * |:-----------:|:-------------:|
   * | `000000000` | 0.000000000秒 |
   * | `999999999` | 0.999999999秒 |
   */
  readonly SSSSSSSSS: "nanosecond";
  /**
   * 曜日(略称)
   *
   * `parse`では`locale`による曜日略称を読み込みますが、結果には影響しません。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `Mon`      | 月曜日 |
   * | `en-US`  | `Sun`      | 日曜日 |
   * | `ja-JP`  | `月`       | 月曜日 |
   * | `ja-JP`  | `日`       | 日曜日 |
   */
  readonly E: "dayOfWeek";
  /**
   * 曜日(略称)
   *
   * `parse`では`locale`による曜日略称を読み込みますが、結果には影響しません。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `Mon`      | 月曜日 |
   * | `en-US`  | `Sun`      | 日曜日 |
   * | `ja-JP`  | `月`       | 月曜日 |
   * | `ja-JP`  | `日`       | 日曜日 |
   */
  readonly EE: "dayOfWeek";
  /**
   * 曜日(略称)
   *
   * `parse`では`locale`による曜日略称を読み込みますが、結果には影響しません。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `Mon`      | 月曜日 |
   * | `en-US`  | `Sun`      | 日曜日 |
   * | `ja-JP`  | `月`       | 月曜日 |
   * | `ja-JP`  | `日`       | 日曜日 |
   */
  readonly EEE: "dayOfWeek";
  /**
   * 曜日
   *
   * `parse`では`locale`による曜日を読み込みますが、結果には影響しません。
   *
   * | `locale` | 入力文字列 | 結果   |
   * |:--------:|:----------:|:------:|
   * | `en-US`  | `Monday`   | 月曜日 |
   * | `en-US`  | `Sunday`   | 日曜日 |
   * | `ja-JP`  | `月曜日`   | 月曜日 |
   * | `ja-JP`  | `日曜日`   | 日曜日 |
   */
  readonly EEEE: "dayOfWeek";
  /**
   * オフセット(UTCの場合はZ、それ以外は±HH、ただし分単位のオフセットがある場合は±HHmm)
   *
   * `parse`では`+`もしくは`-`のあと2桁もしくは4桁の数字をタイムゾーンオフセットとして、もしくは`Z`をUTCとして読み込みます。
   *
   * | 入力文字列 | 結果          |
   * |------------|---------------|
   * | `Z`        | UTC           |
   * | `+09`      | UTC+9時間     |
   * | `-0230`    | UTC-2時間30分 |
   */
  readonly X: "offset";
  /**
   * オフセット(UTCの場合はZ、それ以外は±HHmm)
   *
   * `parse`では`+`もしくは`-`のあと4桁の数字をタイムゾーンオフセットとして、もしくは`Z`をUTCとして読み込みます。
   *
   * | 入力文字列 | 結果          |
   * |------------|---------------|
   * | `Z`        | UTC           |
   * | `+0900`    | UTC+9時間     |
   * | `-0230`    | UTC-2時間30分 |
   */
  readonly XX: "offset";
  /**
   * オフセット(UTCの場合はZ、それ以外は±HH:mm)
   *
   * `parse`では`+`もしくは`-`のあと2桁の数字、`:`、2桁の数字をタイムゾーンオフセットとして、もしくは`Z`をUTCとして読み込みます。
   *
   * | 入力文字列 | 結果          |
   * |------------|---------------|
   * | `Z`        | UTC           |
   * | `+09:00`   | UTC+9時間     |
   * | `-02:30`   | UTC-2時間30分 |
   */
  readonly XXX: "offset";
  /**
   * オフセット(常に±HH、ただし分単位のオフセットがある場合は±HHmm)
   *
   * `parse`では`+`もしくは`-`のあと2桁もしくは4桁の数字をタイムゾーンオフセットとして読み込みます。
   *
   * | 入力文字列 | 結果          |
   * |------------|---------------|
   * | `+00`      | UTC           |
   * | `+09`      | UTC+9時間     |
   * | `-0230`    | UTC-2時間30分 |
   */
  readonly x: "offset";
  /**
   * オフセット(常に±HHmm)
   *
   * `parse`では`+`もしくは`-`のあと4桁の数字をタイムゾーンオフセットとして読み込みます。
   *
   * | 入力文字列 | 結果          |
   * |------------|---------------|
   * | `+0000`    | UTC           |
   * | `+0900`    | UTC+9時間     |
   * | `-0230`    | UTC-2時間30分 |
   */
  readonly xx: "offset";
  /**
   * オフセット(常に±HH:mm)
   *
   * `parse`では`+`もしくは`-`のあと2桁の数字、`:`、2桁の数字をタイムゾーンオフセットとして読み込みます。
   *
   * | 入力文字列 | 結果          |
   * |------------|---------------|
   * | `*00:00`   | UTC           |
   * | `+09:00`   | UTC+9時間     |
   * | `-02:30`   | UTC-2時間30分 |
   */
  readonly xxx: "offset";
};
/**
 * 解析に使用するオプション
 */
interface ParseOptions {
  /** 解析時に使用するオプション {@link Locale} */
  locale?: Locale;
  /**
   * 範囲外の値の扱いを指定するオプション
   *
   * 以下が指定できます。
   *
   * - `reject` 範囲外の値が指定されたら受け付けない(`undefined`を返す): デフォルト
   * - `constrain` 範囲内に収まるように調整して受け付ける
   *
   * 上記以外を指定するとエラーになります。
   */
  overflow?: 'reject' | 'constrain';
}
/**
 * 指定された書式文字列にしたがって、文字列を日付時刻に変換します。
 *
 * 入力文字列が書式文字列にしたがっていない場合はundefinedを返します。
 *
 * `E`や`EEEE`はその位置に曜日の表記がないとundefinedを返しますが、日付の解析の際には無視されます。
 *
 * たとえば、2023/01/01は日曜日ですが、`'2023-01-01 (Mon)'` は書式文字列 `'yyyy-MM-dd (EEE)'` にしたがっているため、解析結果は`undefined`にはならず、また日付にも影響しないため`2023/1/1`となります。
 *
 * 日時や時刻に変換される書式文字列が指定されていないと、つまり曜日やタイムゾーンの書式文字列だけだとエラーになります。
 *
 * また`a`(午前・午後)と`h`や`hh`(12時間制の時)はセットで使用していないとエラーになります。
 *
 * 書式からの解析が不安定になるため同じアルファベットの書式指定子を複数箇所で使用しているとエラーになります。
 * @template F 書式文字列の型
 * @template T 解析の基準となる日付時刻の型。返り値の型にもなります。
 * @param input 解析する文字列
 * @param formatString 文字列から変換するための{@link FormatString 書式文字列}
 * @param reference 解析の基準となる日付時刻。
 * @param options 解析時に使用するオプション
 * @param _ 書式文字列の検査のための引数。この引数を指定する必要はありません。
 * @returns 書式にしたがって文字列から変換されたTemporalのインスタンス
 *
 * 書式文字列にタイムゾーンの書式指定子が指定されている場合
 * 入力文字列から解析された日付や時刻の値がそのタイムゾーンで解釈され
 * referenceと同じタイムゾーンに変換したものを返します。
 * @throws 以下の場合に例外が投げられます
 *
 * - 書式文字列に文字列リテラルだけしか指定しなかった
 * - 書式文字列で引用符が閉じられていなかった
 * - 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
 * - 書式文字列に日時や時刻に変換されるがアルファベットが指定されていない
 * - 書式文字列に`a`(午前・午後)が指定されているのに`h`や`hh`(12時間制の時)が指定されていない
 * - 書式文字列に`h`もしくは`hh`(12時間制の時)が指定されているのに`a`(午前・午後)が指定されていない
 * - 書式文字列に`h`もしくは`hh`(12時間制の時)と`H`もしくは`HH`(24時間制の時)が同時に指定されている
 * - 書式文字列に同じアルファベットの書式指定子を複数箇所で使用している
 * - 未対応のロケールを指定した
 * - 未対応のoverflow
 * @see {@link format}
 */
declare function parse<F extends string, T extends _T, _T = ReferenceFor<F>>(input: string, formatString: F, reference: T, options?: ParseOptions, ..._: ValidateFormatString<F, 'parse'>): T | undefined;
export { type FormatOptions, type FormatString, type Locale, type ParseOptions, format, parse };
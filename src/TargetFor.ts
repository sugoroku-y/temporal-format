import type { FormatTokenMap } from './constants';
import type { FormatTarget } from './FormatTarget';
import type {
    ParseFormatString,
    SuccessResult,
    TokenNode,
} from './parseFormatString';
import type { NonNullish } from './types';

type RequiredProperties<S extends string> =
    // SのUnion展開
    S extends S
        ? // 書式文字列の解析に成功していれば各ノードをParsedに割当
          ParseFormatString<S> extends SuccessResult<infer Parsed>
            ? // ノード中の書式指定子に対応するプロパティ
              FormatTokenMap[Extract<
                  Extract<Parsed, TokenNode>[0],
                  keyof FormatTokenMap
              >]['p'][number]
            : // 解析失敗時には絞り込まない
              never
        : // SのUnion展開のためのextendsなのでここには来ない
          never;

type TargetForSub<
    Properties extends FormatTokenMap[keyof FormatTokenMap]['p'][number],
> =
    // Propertiesが空の場合
    [Properties] extends [never]
        ? // FormatTargetを返す
          FormatTarget
        : // ZonedDateTimeが持つPropertiesと同じ名前のプロパティを持つオブジェクト型を返す
          Pick<Temporal.ZonedDateTime, Properties>;

type ReferenceForSub<
    Properties extends FormatTokenMap[keyof FormatTokenMap]['p'][number],
> = TargetForSub<Properties> & {
    with(
        like: TargetForSub<Exclude<Properties, 'dayOfWeek' | 'offset'>>,
    ): unknown;
} & ('offset' extends Properties
        ? Pick<Temporal.ZonedDateTime, 'withTimeZone'>
        : NonNullish);

/**
 * formatで指定された書式文字列に対してtargetに指定できるインスタンスの型を生成する型関数
 *
 * 書式指定子に対応するプロパティを持つオブジェクト型を返す。
 */
export type TargetFor<S extends string> =
    // string型やテンプレートリテラル型なら
    NonNullish extends Record<S, never>
        ? // 解析できないのでFormatTargetを返す
          FormatTarget
        : TargetForSub<RequiredProperties<S>>;

/**
 * parseで指定された書式文字列に対してreferenceに指定できるインスタンスの型を生成する型関数
 *
 * 書式指定子に対応するプロパティとwithメソッド、及び必要ならwithTimeZoneメソッドを持つオブジェクト型を返す。
 *
 */
export type ReferenceFor<S extends string> =
    // string型やテンプレートリテラル型なら
    NonNullish extends Record<S, never>
        ? // 解析できないのでFormatTargetを返す
          FormatTarget
        : ReferenceForSub<RequiredProperties<S>>;

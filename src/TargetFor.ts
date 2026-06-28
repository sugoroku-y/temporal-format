import type { PropertyMap } from './constants';
import type { FormatTarget } from './FormatTarget';
import type { NonNullish } from './types';
import type { ParseFormatString, TokenNode } from './ValidateFormatString';

/** @internal */
type RequiredProperties<S extends string> =
    // SのUnion展開
    S extends S
        ? // 書式文字列の解析に成功していれば各ノードをParsedに割当
          ParseFormatString<S> extends (infer Parsed)[]
            ? // ノード中に書式指定子があればTokenに割当
              Parsed extends TokenNode<infer Token extends keyof PropertyMap>
                ? // 書式文字列があればプロパティ名に変換
                  PropertyMap[Token][number]
                : // 書式文字列がなければ絞り込まない
                  never
            : // 解析失敗時には絞り込まない
              never
        : // SのUnion展開のためのextendsなのでここには来ない
          never;
/** @internal */
type TargetFor_Simple<
    Properties extends PropertyMap[keyof PropertyMap][number],
> =
    // Propertiesが空の場合
    [Properties] extends [never]
        ? // FormatTargetを返す
          FormatTarget
        : // ZonedDateTimeが持つPropertiesと同じ名前のプロパティを持つオブジェクト型を返す
          Pick<Temporal.ZonedDateTime, Properties>;
/** @internal */
type ReferenceFor_Simple<
    Properties extends PropertyMap[keyof PropertyMap][number],
> = TargetFor_Simple<Properties> & {
    with(
        like: TargetFor_Simple<
            Exclude<Properties, 'dayOfWeek' | 'offsetNanoseconds'>
        >,
    ): unknown;
} & ('offsetNanoseconds' extends Properties
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
        : TargetFor_Simple<RequiredProperties<S>>;

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
        : ReferenceFor_Simple<RequiredProperties<S>>;

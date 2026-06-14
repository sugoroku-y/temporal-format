import type { PropertyMap } from './constants';
import type { FormatTarget } from './FormatTarget';
import type { FormatToken, ParseFormatString } from './ValidateFormatString';

export type TargetFor<S extends string> =
 Extract<
    FormatTarget,
Record<
    // SのUnion展開
    S extends S
        ? // 書式文字列があればFに割当
          Extract<
              ParseFormatString<S>[number],
              FormatToken
          > extends infer F extends FormatToken
            ? // 書式文字列がなければ
              [F] extends [never]
                ? // 無視
                  never
                : // 書式文字列があれば
                  F extends FormatToken<infer Unit extends keyof PropertyMap>
                  ? // プロパティ名に変換
                    PropertyMap[Unit]
                  : // Unitの割当のためのextendsなのでここには来ない
                    never
            : // Fの割当のためのextendsなのでここには来ない
              never
        : // SのUnion展開のためのextendsなのでここには来ない
          never,unknown>
>;

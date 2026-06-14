import { assert } from './asserts';
import { propertyMap, type PropertyMap } from './constants';
import { error } from './error';
import { isKeyOf } from './isKeyOf';
import type { FormatToken, LiteralToken } from './ValidateFormatString';

/** @internal */
export type ParsedFormatString = ReadonlyArray<
  LiteralToken | FormatToken<keyof PropertyMap>
>;

type Cache = { result: ParsedFormatString } | { result?: never; error: string };

const cache = new Map<string, Cache>();

/** @internal */
export function parseFormatString(formatString: string): ParsedFormatString {
  const cached = cache.get(formatString);
  if (cached) {
    return cached.result ?? error(cached.error);
  }
  try {
    let hasFormatToken = false;
    const tokens: ParsedFormatString = [
      ...(function* () {
        let lastIndex = 0;
        for (const {
          index,
          0: match,
          2: startQuote,
          3: quoted,
          4: endQuote,
        } of formatString.matchAll(
          /([A-Za-z])\1*|(')([^']*(?:''[^']*)*)('|$)/g,
        )) {
          if (lastIndex < index) {
            yield formatString.slice(lastIndex, index);
          }
          lastIndex = index + match.length;
          if (match === "''") {
            yield "'";
            continue;
          }
          if (startQuote) {
            if (!endQuote) {
              error`引用符が閉じられていません: ${formatString}`;
            }
            yield quoted.replace(/''/g, "'");
            continue;
          }
          if (match.length > 4) {
            error`5文字以上の書式文字列はサポートされていません: ${match}`;
          }
          yield [
            isKeyOf(match, propertyMap)
              ? match
              : error`無効な書式文字列です: ${match}`,
          ] satisfies FormatToken<keyof PropertyMap>;
          hasFormatToken = true;
        }
      })(),
    ];
    if (!hasFormatToken) {
      error`書式文字列がありません: ${formatString}`;
    }
    cache.set(formatString, { result: tokens });
    return tokens;
  } catch (e) {
    assert(e instanceof Error);
    cache.set(formatString, { error: e.message });
    throw e;
  }
}

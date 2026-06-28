import { assert } from './asserts';
import { propertyMap, type PropertyMap } from './constants';
import { error } from './error';
import { isKeyOf } from './isKeyOf';
import type { LiteralNode, TokenNode } from './ValidateFormatString';

/** @internal */
export type ParsedFormatString = ReadonlyArray<
    LiteralNode | TokenNode<keyof PropertyMap>
>;

type Cache = { result: ParsedFormatString } | { result?: never; error: string };

const cache = new Map<string, Cache>();

/** @internal */
export function parseFormatString(formatString: string): ParsedFormatString {
    const cached = cache.get(formatString);
    if (cached) {
        return cached.result ?? error`${cached.error}: ${formatString}`;
    }
    try {
        let hasToken = false;
        const nodes: [...ParsedFormatString] = [];
        const addToken = (token: keyof PropertyMap) => {
            nodes.push([token]);
            hasToken = true;
        };
        const addLiteral = (literal: string) => {
            if (
                nodes.length > 0 &&
                typeof nodes[nodes.length - 1] === 'string'
            ) {
                nodes[nodes.length - 1] += literal;
            } else {
                nodes.push(literal);
            }
        };
        let lastIndex = 0;
        for (const {
            index,
            0: match,
            2: startQuote,
            3: quoted,
            4: endQuote,
        } of formatString.matchAll(
            /([A-Za-z])\1*|(['"])([^'"]*(?:(?:''|"")[^'"]*)*)(['"]|$)/g,
        )) {
            if (lastIndex < index) {
                addLiteral(formatString.slice(lastIndex, index));
            }
            lastIndex = index + match.length;
            if (match === "''" || match === '""') {
                addLiteral(match.charAt(0));
                continue;
            }
            if (startQuote) {
                if (!endQuote) {
                    throw `引用符${startQuote}が閉じられていません`;
                }
                if (startQuote !== endQuote) {
                    throw `単独の引用符${endQuote}が使われています`;
                }
                addLiteral(quoted.replace(/(['"])\1/g, '$1'));
                continue;
            }
            if (!isKeyOf(match, propertyMap)) {
                throw `無効な書式文字列です: ${match}`;
            }
            addToken(match);
        }
        if (lastIndex < formatString.length) {
            addLiteral(formatString.slice(lastIndex));
        }
        if (!hasToken) {
            throw '書式文字列がありません';
        }
        cache.set(formatString, { result: nodes });
        return nodes;
    } catch (message) {
        assert(typeof message === 'string');
        cache.set(formatString, { error: message });
        error(`${message}: ${formatString}`);
    }
}

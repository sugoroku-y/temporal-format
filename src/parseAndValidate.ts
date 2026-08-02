import { assert } from './asserts';
import type { ParsedFormatString } from './constants';
import { error } from './error';
import type { FormatTarget } from './FormatTarget';
import { parseFormatString } from './parseFormatString';
import type { Purpose } from './ValidateFormatString';
import { validateProperties } from './validateProperties';

export function parseAndValidate(
    formatString: string,
    target: FormatTarget,
    purpose: Purpose,
): ParsedFormatString {
    try {
        const node = parseFormatString(formatString);
        validateProperties(node, target, purpose);
        return node;
    } catch (ex) {
        assert(
            ex instanceof Error,
            'eslintの設定でthrowされるものはError派生のはず',
        );
        error(`${ex.message}: ${formatString}`);
    }
}

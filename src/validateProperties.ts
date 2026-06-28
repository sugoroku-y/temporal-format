import { assert } from './asserts';
import { propertyMap } from './constants';
import type { FormatTarget } from './FormatTarget';
import { isKeyOf } from './isKeyOf';
import type { ParsedFormatString } from './parseFormatString';

export function validateProperties(
    nodes: ParsedFormatString,
    instance: FormatTarget,
): asserts instance is Temporal.ZonedDateTime {
    for (const node of nodes) {
        if (typeof node === 'string') {
            continue;
        }
        for (const property of propertyMap[node[0]]) {
            assert(
                isKeyOf(property, instance),
                `${instance.constructor.name}にはプロパティ${property}がありません: ${node[0]}`,
            );
        }
    }
}

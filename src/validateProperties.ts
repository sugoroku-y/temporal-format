import { assert } from './asserts';
import {
    DATE_TIME_TOKEN,
    FORMAT_TOKEN_MAP,
    isSupportedToken,
    OFFSET_TOKEN,
    type ParsedFormatString,
} from './constants';
import type { FormatTarget } from './FormatTarget';
import { isKeyOf } from './isKeyOf';
import { messageKeys } from './messages';
import type { SuccessResult } from './parseFormatString';
import { TemporalFormatError } from './TemporalFormatError';
import type { Alphabet } from './types';
import type { Purpose } from './ValidateFormatString';

export function validateProperties(
    nodes: SuccessResult,
    instance: FormatTarget,
    purpose: Purpose,
): asserts nodes is ParsedFormatString {
    let hasDateTime = false;
    let hasDayPeriod = false;
    let has12hours = false;
    let has24hours = false;
    let hasTimeZone = false;
    const alphabetMap: Partial<Record<Alphabet, number[]>> = {};
    for (const node of nodes) {
        if (typeof node === 'string') {
            continue;
        }
        const token = node[0].repeat(node[1]);
        assert(
            isSupportedToken(node),
            TemporalFormatError,
            messageKeys.invalidFormatToken,
            {
                token,
            },
        );
        const [char, length] = node;

        for (const property of FORMAT_TOKEN_MAP[char].properties) {
            assert(
                isKeyOf(property, instance),
                TemporalFormatError,
                messageKeys.noProperty,
                {
                    instance: instance.constructor.name,
                    property,
                    token,
                },
            );
        }
        hasDateTime ||= char in DATE_TIME_TOKEN;
        hasDayPeriod ||= char === 'a';
        has12hours ||= char === 'h';
        has24hours ||= char === 'H';
        hasTimeZone ||= char in OFFSET_TOKEN;
        alphabetMap[char] = [...(alphabetMap[char] ?? []), length];
    }
    if (purpose === 'format') {
        // format向けの検証はここまで
        return;
    }
    // parse向けの検証はメソッドの存在確認、書式指定子の組み合わせ確認
    assert(
        'with' in instance && typeof instance.with === 'function',
        TemporalFormatError,
        messageKeys.noMethod,
        { instance: instance.constructor.name, method: 'with' },
    );
    assert(
        !hasTimeZone ||
            ('withTimeZone' in instance &&
                typeof instance.withTimeZone === 'function'),
        TemporalFormatError,
        messageKeys.noMethod,
        { instance: instance.constructor.name, method: 'withTimeZone' },
    );
    assert(hasDateTime, TemporalFormatError, messageKeys.noDateTimeToken);
    if (hasDayPeriod) {
        assert(
            has12hours,
            TemporalFormatError,
            messageKeys.required12hoursWhenUsingAmPm,
        );
        assert(
            !has24hours,
            TemporalFormatError,
            messageKeys.dontUseBoth12hoursAnd24Hours,
        );
    } else {
        assert(
            !has12hours,
            TemporalFormatError,
            messageKeys.requiredAmPmWhenUsing12hours,
        );
    }
    const found = Object.entries(alphabetMap).find(
        ([, { length }]) => length > 1,
    );
    assert(!found, TemporalFormatError, messageKeys.duplicateFormatToken, {
        token: found?.[0].repeat(found[1][0]) ?? '',
    });
}

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
        if (!isSupportedToken(node)) {
            throwMessage(messageKeys.invalidFormatToken, {
                token,
            });
        }
        const [char, length] = node;

        for (const property of FORMAT_TOKEN_MAP[char].properties) {
            if (!isKeyOf(property, instance)) {
                throwMessage(messageKeys.noProperty, {
                    instance: instance.constructor.name,
                    property,
                    token,
                });
            }
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
    if (!('with' in instance && typeof instance.with === 'function')) {
        throwMessage(messageKeys.noMethod, {
            instance: instance.constructor.name,
            method: 'with',
        });
    }
    if (
        hasTimeZone &&
        !(
            'withTimeZone' in instance &&
            typeof instance.withTimeZone === 'function'
        )
    ) {
        throwMessage(messageKeys.noMethod, {
            instance: instance.constructor.name,
            method: 'withTimeZone',
        });
    }
    if (!hasDateTime) {
        throwMessage(messageKeys.noDateTimeToken);
    }
    if (hasDayPeriod) {
        if (!has12hours) {
            throwMessage(messageKeys.required12hoursWhenUsingAmPm);
        }
        if (has24hours) {
            throwMessage(messageKeys.dontUseBoth12hoursAnd24Hours);
        }
    } else {
        if (has12hours) {
            throwMessage(messageKeys.requiredAmPmWhenUsing12hours);
        }
    }
    const found = Object.entries(alphabetMap).find(
        ([, { length }]) => length > 1,
    );
    if (found) {
        throwMessage(messageKeys.duplicateFormatToken, {
            token: found[0].repeat(found[1][0]),
        });
    }
}

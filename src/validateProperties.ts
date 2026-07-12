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
import type { SuccessResult } from './parseFormatString';
import type { Purpose } from './ValidateFormatString';

export function validateProperties(
    nodes: SuccessResult,
    instance: FormatTarget,
    formatString: string,
    purpose: Purpose,
): asserts nodes is ParsedFormatString {
    let hasDateTime = false;
    let hasDayPeriod = false;
    let has12hours = false;
    let has24hours = false;
    let hasTimeZone = false;
    for (const node of nodes) {
        if (typeof node === 'string') {
            continue;
        }
        assert(
            isSupportedToken(node),
            `無効な書式指定子です: ${node[0].repeat(node[1])}: ${formatString}`,
        );
        const [char, length] = node;

        for (const property of FORMAT_TOKEN_MAP[char].properties) {
            assert(
                isKeyOf(property, instance),
                `${instance.constructor.name}にはプロパティ${property}がありません: ${char.repeat(length)}: ${formatString}`,
            );
        }
        hasDateTime ||= char in DATE_TIME_TOKEN;
        hasDayPeriod ||= char === 'a';
        has12hours ||= char === 'h';
        has24hours ||= char === 'H';
        hasTimeZone ||= char in OFFSET_TOKEN;
    }
    if (purpose === 'format') {
        // format向けの検証はここまで
        return;
    }
    // parse向けの検証はメソッドの存在確認、書式指定子の組み合わせ確認
    assert(
        'with' in instance && typeof instance.with === 'function',
        `${instance.constructor.name}にはメソッドwithがありません`,
    );
    if (hasTimeZone) {
        assert(
            'withTimeZone' in instance &&
                typeof instance.withTimeZone === 'function',
            `${instance.constructor.name}にはメソッドwithTimeZoneがありません`,
        );
    }
    assert(hasDateTime, `日付か時刻の書式文字列がありません: ${formatString}`);
    if (hasDayPeriod) {
        assert(
            has12hours,
            `午前/午後(a)がある場合、12時間表記(h/hh)も必要です: ${formatString}`,
        );
        assert(
            !has24hours,
            '12時間表記(h/hh)と24時間表記(H/HH)の両方を指定することはできません',
        );
    } else {
        assert(
            !has12hours,
            `12時間表記(h/hh)がある場合、午前/午後(a)も必要です: ${formatString}`,
        );
    }
}

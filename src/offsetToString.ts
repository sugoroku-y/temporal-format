import { padNumber } from './padNumber';

/** @internal */
export function offsetToString(
    offsetNanoseconds: number,
    type: 'short' | 'long' | 'full',
): string {
    const sign = offsetNanoseconds < 0 ? '-' : '+';
    const absOffset = Math.abs(Math.floor(offsetNanoseconds / 60000000000));
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    if (type === 'short' && minutes === 0) {
        return `${sign}${padNumber(hours, 2)}`;
    }
    return `${sign}${padNumber(hours, 2)}${type === 'full' ? ':' : ''}${padNumber(minutes, 2)}`;
}

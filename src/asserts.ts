import type { MessageKey } from './messages';
import { TemporalFormatError } from './TemporalFormatError';

export function assert<Key extends MessageKey>(
    condition: unknown,
    Class: typeof TemporalFormatError,
    ...params: ConstructorParameters<typeof TemporalFormatError<Key>>
): asserts condition;
export function assert<ErrorClass extends new (...args: never) => Error>(
    condition: unknown,
    Class: ErrorClass,
    ...args: ConstructorParameters<ErrorClass>
): asserts condition;
export function assert(
    condition: unknown,
    message: () => string,
): asserts condition;
export function assert(condition: unknown, message?: string): asserts condition;
export function assert(condition: unknown, ...args: unknown[]): void {
    if (!condition) {
        const [arg1, ...rest] = args;
        const [ErrorClass, parameters] = (
            arg1 === undefined
                ? [Error, ['Assertion Failure']]
                : typeof arg1 === 'string'
                  ? [Error, [arg1]]
                  : typeof arg1 === 'function' && arg1.prototype
                    ? [arg1, rest]
                    : [Error, [String((arg1 as () => string)())]]
        ) as [new (...args: unknown[]) => Error, unknown[]];
        throw new ErrorClass(...parameters);
    }
}

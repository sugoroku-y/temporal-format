import { error } from './error';

export function assert(
    condition: unknown,
    message?: string,
): asserts condition {
    if (!condition) {
        void error`${message ?? 'Assertion failed'}${assert}`;
    }
}

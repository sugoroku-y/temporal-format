import { error } from "./error";

/** @internal */
export function assert(condition: unknown, message?: string): asserts condition {
    // v8 ignore next
    if (!condition) {
        error(message ?? 'Assertion failed');
    }
}
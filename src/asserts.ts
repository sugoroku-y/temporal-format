import { error } from "./error";

/** @internal */
export function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        error(message ?? 'Assertion failed');
    }
}
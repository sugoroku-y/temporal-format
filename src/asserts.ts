import { error } from "./error";

export function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        error(message ?? 'Assertion failed');
    }
}
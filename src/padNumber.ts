/** @internal */
export function padNumber(value: number, length = 2): string {
    return String(value).padStart(length, '0');
}

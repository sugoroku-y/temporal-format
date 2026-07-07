/** @internal */
export function isKeyOf<T extends object, K extends string>(
    key: K,
    obj: T,
): key is K & keyof T {
    return key in obj;
}

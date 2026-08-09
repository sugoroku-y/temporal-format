export function entry<Key extends PropertyKey, Value>(
    keys: Key | readonly Key[],
    value: Value,
) {
    const result = {};
    for (const char of Array.isArray(keys) ? keys : [keys]) {
        Object.assign(result, { [char]: value });
    }
    return result as Record<Key, Value>;
}

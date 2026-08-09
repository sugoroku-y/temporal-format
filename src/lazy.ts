export function lazy(
    ...args: [TemplateStringsArray, ...unknown[]]
): () => string {
    return () => args[0].reduce((r, e, i) => `${r}${String(args[i])}${e}`);
}

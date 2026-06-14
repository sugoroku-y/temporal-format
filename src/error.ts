/** @internal */
export function error(message: string): never;
/** @internal */
export function error(
    template: TemplateStringsArray,
    ...values: unknown[]
): never;
export function error(
    ...args:
        | [message: string]
        | [template: TemplateStringsArray, ...values: unknown[]]
): never {
    const message = Array.isArray(args[0])
        ? args[0].reduce((r, e, i) => `${r}${args[i]}${e}`)
        : args[0];
    const ex = new Error(message);
    Error.captureStackTrace(ex, error);
    throw ex;
}

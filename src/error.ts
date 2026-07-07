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
    let cause: Error | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let constructorOpt: Function | undefined;
    const message = Array.isArray(args[0])
        ? args[0].reduce((r, e, i) => {
              let value = args[i];
              if (value instanceof Error) {
                  cause = value;
                  value = cause.message;
              }
              if (typeof value === 'function') {
                  constructorOpt = value;
                  value = '';
              }
              return `${r}${value}${e}`;
          })
        : args[0];
    const ex = new Error(message, { cause });
    Error.captureStackTrace(ex, constructorOpt ?? error);
    throw ex;
}

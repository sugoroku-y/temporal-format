type Split<S extends string> = S extends `${infer First}${infer Rest}`
    ? First | Split<Rest>
    : never;
type UppercaseAlphabet = Split<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>;
type LowercaseAlphabet = Lowercase<UppercaseAlphabet>;
export type Alphabet = UppercaseAlphabet | LowercaseAlphabet;

type Character9<C extends string> = C extends C
    ? `${C}${C | ''}${C | ''}${C | ''}${C | ''}${C | ''}${C | ''}${C | ''}${C | ''}`
    : never;
export type Alphabet9 = Character9<Alphabet>;

export type AllPropertyNames<T> = T extends T
    ? keyof {
          [K in keyof T as K extends string
              ? T[K] extends (..._: never) => unknown
                  ? never
                  : K
              : never]: 1;
      }
    : never;

export type NumberProperties<T> = keyof {
    [K in keyof T as NonNullable<T[K]> extends number ? K : never]: 1;
};

export type NonNullish = Record<never, never>;

export type FailoverIfNever<T, Fallback> = [T] extends [never] ? Fallback : T;

type Counter<N extends number, R extends 1[] = []> = R['length'] extends N
    ? R
    : Counter<N, [1, ...R]>;
export type Increment<N extends number> = Extract<
    [...Counter<N>, 1]['length'],
    number
>;

type RepeatSub<
    S extends string,
    N extends number,
    R extends string,
    C extends 1[],
> = C['length'] extends N ? R : RepeatSub<S, N, `${R}${S}`, [1, ...C]>;
export type Repeat<S extends string, N extends number> = S extends S
    ? N extends N
        ? RepeatSub<S, N, '', []>
        : never
    : never;

export type EnableAccessingNonProperty<T, U = T> = T extends T
    ? T &
          Partial<
              Readonly<
                  Record<U extends U ? Exclude<keyof U, keyof T> : never, never>
              >
          >
    : never;

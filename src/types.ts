type Split<S extends string> = S extends `${infer First}${infer Rest}`
    ? First | Split<Rest>
    : never;
type UppercaseAlphabet = Split<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>;
type LowercaseAlphabet = Lowercase<UppercaseAlphabet>;
export type Alphabet = UppercaseAlphabet | LowercaseAlphabet;

type Character4<C extends string> = C extends C
    ? `${C}${C | ''}${C | ''}${C | ''}`
    : never;
export type Alphabet4 = Character4<Alphabet>;

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

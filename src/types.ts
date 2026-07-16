type Split<S extends string> = S extends `${infer First}${infer Rest}`
    ? First | Split<Rest>
    : never;
type UppercaseAlphabet = Split<'ABCDEFGHIJKLMNOPQRSTUVWXYZ'>;
type LowercaseAlphabet = Lowercase<UppercaseAlphabet>;
/** アルファベット1文字の文字列リテラル型 */
export type Alphabet = UppercaseAlphabet | LowercaseAlphabet;

/**
 * 文字列型のキーのうちメソッドでない(つまりプロパティ)のものを抽出
 */
export type AllPropertyNames<T> = T extends T
    ? keyof {
          [
              K in keyof T as K extends string
                  ? T[K] extends (..._: never) => unknown
                      ? never
                      : K
                  : never
          ]: 1;
      }
    : never;

export type NumberProperties<T> = keyof {
    [K in keyof T as NonNullable<T[K]> extends number ? K : never]: 1;
};

/**
 * `{}`型はeslintで警告されるため別名を用意
 */
export type NonNullish = Record<never, never>;

/**
 * TがneverならばFallbackにする
 */
export type FailoverIfNever<T, Fallback> = [T] extends [never] ? Fallback : T;

type Counter<N extends number, R extends 1[] = []> = R['length'] extends N
    ? R
    : Counter<N, [1, ...R]>;
/**
 * 数を1つ増やす
 */
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

/**
 * 文字列リテラル型を指定回数繰り返した文字列リテラル型を返す型関数
 *
 * S、N。いずれもUnion型を指定するとそれぞれの型で繰り返したUnion型となる。
 * @template S 文字列リテラル型
 * @template N 繰り返す回数
 */
export type Repeat<S extends string, N extends number> = S extends S
    ? N extends N
        ? RepeatSub<S, N, '', []>
        : never
    : never;

/**
 * Union型で指定されているその他の型が持つすべてのプロパティをアクセス可能にする。
 *
 * ただし、readonlyでoptionalなnever型になるため、アクセスしてもundefinedになる。
 *
 * (JavaScriptで存在しないプロパティにアクセスしたときと同じ)
 */
export type EnableAccessingNonProperty<
    T,
    AllKeys extends PropertyKey = T extends T ? keyof T : never,
> = T extends T
    ? T & Partial<Readonly<Record<Exclude<AllKeys, keyof T>, never>>>
    : never;

/**
 * Union(A | B)をIntersection(A & B)に変換する
 */
export type UnionToIntersection<U> = (
    U extends U ? (_: U) => 0 : never
) extends (_: infer R) => 0
    ? R
    : never;

/**
 * Unionから最後の要素を1つ取り出す
 *
 * オーバーロード関数(複数のシグネチャのIntersection)から引数を取り出すと
 * 1つのシグネチャの引数のみ取り出せる、という明文化されていない特性を利用しているため
 * TypeScriptの仕様変更により動かなくなる可能性があるので注意が必要
 */
type UnionLast<U> =
    UnionToIntersection<U extends U ? (_: U) => 0 : never> extends (
        x: infer R,
    ) => 0
        ? R
        : never;

/**
 * Unionをタプルに変換する型関数
 */
export type UnionToTuple<T, Last = UnionLast<T>> = [T] extends [never]
    ? []
    : [...UnionToTuple<Exclude<T, Last>>, Last];

export type CountOfUnion<T, R extends 1[] = [], U = T> = [T] extends [never]
    ? R['length']
    : T extends T
      ? CountOfUnion<Exclude<U, T>, [...R, 1]>
      : never;

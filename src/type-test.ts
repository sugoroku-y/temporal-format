// 型関数のテスト用
export type ToEqual<Expected> = Expected;
type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;
export type It<Name extends string, T extends true> = T extends true
    ? []
    : [Record<Name, T>];
export type Expect<Actual, Expected> =
    Equal<Actual, Expected> extends true
        ? true
        : {
              actual: Actual;
              expected: Expected;
          };

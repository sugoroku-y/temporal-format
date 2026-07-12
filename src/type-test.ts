/**
 * 型関数のテスト用型関数
 *
 * @example
 * declare const _test_TestFunc: [
 *     ...It<
 *         'First TestFunc Unit Test',
 *         Expect<TestFunc<1>, ToEqual<2>>
 *     >,
 * ];
 */
export type It<Name extends string, T extends true> =
    // 結果がtrueなら
    T extends true
        ? // 中身なし
          []
        : // でなければ内容を残す
          [Record<Name, T>];
export type Expect<Actual, Verb> = Verb extends {
    verb: 'toEqual';
    expected: infer Expected;
}
    ? Equal<Actual, Expected> extends true
        ? true
        : {
              actual: Actual;
              expected: Expected;
          }
    : { message: '不明なVerb'; verb: Verb };
type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;
export interface ToEqual<Expected> {
    verb: 'toEqual';
    expected: Expected;
}

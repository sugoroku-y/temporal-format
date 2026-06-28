declare global {
    interface ArrayConstructor {
        // isArrayを参照専用配列でも型ガードとして利用できるようにする
        isArray<T>(
            o: T,
            /**
             * 可変長引数を用いたオーバーロード制御ハック
             *
             * 以下のケースでは `never` を返し、このシグネチャを「マッチ失敗」にすることで
             * 標準(lib.es5.d.ts)の `isArray` 定義へと安全にフォールバック(譲渡)させます。
             *
             * 1. `unknown extends T` : 引数が `any` または `unknown` のケースを最優先で除外
             * 2. `T extends readonly unknown[]`(にマッチしない場合): 配列の可能性が一切ない型(例: `string` 単体)を除外
             *
             * これらを除外することで、配列型が混ざった Union 型(例: `string | number[]`)の時だけ
             * このジェネリック定義が走り、配列の型だけを綺麗にマッピング(Extract)できます。
             */
            ..._: // anyやunknownを指定した場合
            unknown extends T
                ? // このシグネチャが使われないようにすることで標準のisArrayが使用される
                  never
                : // TのUnionを展開
                  T extends T
                  ? // 一つでも参照専用の配列があれば
                    T extends readonly unknown[]
                      ? // このシグネチャが有効になるようにする
                        []
                      : // 全く無ければこのシグネチャが使われないように
                        never
                  : // Unionの展開のためなのでここのneverには意味がない
                    never
        ): // TのUnion型の中で配列であるもの(参照専用かどうかに関わらず)だけを抽出
        o is Extract<T, readonly unknown[]>;
    }

    interface Array<T> {
        includes<U>(searchElement: U, fromIndex?: number, ..._: T extends U ? [] : never): boolean;
    }

}

export {};
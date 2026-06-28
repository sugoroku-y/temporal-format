# インターフェイス: ParseOptions

解析に使用するオプション

## プロパティ

### locale?

> `optional` **locale?**: `"en-US"` \| `"ja-JP"`

解析時に使用するオプション [Locale](../type-aliases/Locale.md)

***

### overflow?

> `optional` **overflow?**: `"reject"` \| `"constrain"`

範囲外の値の扱いを指定するオプション

以下が指定できます。

- `reject` 範囲外の値が指定されたら受け付けない(`undefined`を返す): デフォルト
- `constrain` 範囲内に収まるように調整して受け付ける

上記以外を指定するとエラーになります。

# 関数: format()

> **format**\<`FormatString`\>(`target`, `formatString`, `options?`, ...`_`): `string`

指定された書式文字列にしたがって、日付時刻を文字列に変換します。

書式文字列は `target` のプロパティの内容に基づいて変換されます。

## 型パラメーター

### FormatString

`FormatString` *extends* `string`

書式文字列の型

## パラメーター

### target

`TargetFor`\<`FormatString`\>

文字列に変換する日付時刻。

書式文字列で指定された書式指定子に必要とされるプロパティを持つ必要があります。

### formatString

`FormatString`

文字列に変換するための[書式文字列](../variables/propertyMap.md)

### options?

[`FormatOptions`](../interfaces/FormatOptions.md)

整形時に使用するオプション

### \_

...`ValidateFormatString`\<`FormatString`, `"format"`\>

## 戻り値

`string`

書式にしたがって変換された文字列

## 例外

以下の場合に例外が投げられます

- 書式文字列にリテラル文字列だけしか指定しなかった
- 書式文字列で引用符が閉じられていなかった
- 書式文字列で単独の引用符を使用した
- 書式文字列で無効な書式指定子を使用した
- 書式文字列で変換対象となるプロパティを持たないインスタンスを指定した
-
- 未対応のロケールを指定した

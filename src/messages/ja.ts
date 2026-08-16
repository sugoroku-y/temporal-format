const messages = {
    /** サポートされていないロケール名が指定されたときのエラー */
    unsupportedLocale: 'サポートされていないロケール: ${locale}',
    /** サポートされていないカレンダーIDが指定されたときのエラー */
    unsupportedCalendarId: 'サポートされていないカレンダーID: ${calendarId}',
    /** monthCodeの値が想定外だったときのエラー */
    invalidMonthCode: '想定外のmonthCode: ${monthCode}',
    /** サポートされていないoverflowの挙動が指定されたときのエラー */
    unsupportedOverflow:
        'サポートされていないオーバーフローの挙動: ${overflow}',
    /** 対象インスタンスに指定したプロパティが存在しないときのエラー */
    noProperty: '${instance}にはプロパティ${property}がありません: ${token}',
    /** 対象インスタンスに指定したメソッドが存在しないときのエラー */
    noMethod: '${instance}にはメソッド${method}がありません',

    /** 引用符が閉じられていないときのエラー */
    unclosedQuote: '引用符${quote}が閉じられていません',
    /** 引用符が単独で使用されているときのエラー */
    independentQuote: '引用符${quote}が単独で使用されています',
    /** 書式指定子がないときのエラー */
    noFormatToken: '書式指定子が見つかりません',
    /** 無効な書式指定子が含まれているときのエラー */
    invalidFormatToken: '無効な書式指定子: ${token}',
    /** 日付または時刻に対応する書式指定子がないときのエラー */
    noDateTimeToken: '日付または時刻の書式指定子がありません',
    /** 午前/午後を使う場合に12時間表記が不足しているときのエラー */
    required12hoursWhenUsingAmPm:
        '午前/午後(a)を使う場合、12時間表記(h/hh)が必要です',
    /** 12時間表記と24時間表記を同時に使ったときのエラー */
    dontUseBoth12hoursAnd24Hours:
        '12時間表記(h/hh)と24時間表記(H/HH)を同時に指定することはできません',
    /** 12時間表記を使う場合に午前/午後が不足しているときのエラー */
    requiredAmPmWhenUsing12hours:
        '12時間表記(h/hh)を使う場合、午前/午後(a)が必要です',
    /** 書式指定子が重複しているときのエラー */
    duplicateFormatToken: '書式指定子が重複しています: ${token}',
} as const;

export default messages;

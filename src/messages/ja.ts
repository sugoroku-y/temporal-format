const messages = {
    /** サポートしていないロケール */
    unsupportedLocale: 'サポートしていないロケール: ${locale}',
    unsupportedCalendarId: '対応していないカレンダーです: ${calendarId}',
    invalidMonthCode: '想定外のmonthCodeです: ${monthCode}',
    unsupportedOverflow: 'サポートしていないオーバーフローの挙動: ${overflow}',
    noProperty: '${instance}にはプロパティ${property}がありません: ${token}',
    noMethod: '${instance}にはメソッド${method}がありません',

    unclosedQuote: '引用符${quote}が閉じられていません',
    independentQuote: '単独の引用符${quote}が使われています',
    noFormatToken: '書式指定子がありません',
    invalidFormatToken: '無効な書式指定子です: ${token}',
    noDateTimeToken: '日付や時刻の書式指定子がありません',
    required12hoursWhenUsingAmPm:
        '午前/午後(a)がある場合、12時間表記(h/hh)も必要です',
    dontUseBoth12hoursAnd24Hours:
        '12時間表記(h/hh)と24時間表記(H/HH)の両方を指定することはできません',
    requiredAmPmWhenUsing12hours:
        '12時間表記(h/hh)がある場合、午前/午後(a)も必要です',
    duplicateFormatToken: '書式指定子が重複しています: ${token}',
} as const;

export default messages;

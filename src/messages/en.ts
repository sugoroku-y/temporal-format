import ja from './ja';

const messages = {
    unsupportedLocale: 'Unsupported locale: ${locale}',
    unsupportedCalendarId: 'Unsupported calendar: ${calendarId}',
    invalidMonthCode: 'Unexpected monthCode: ${monthCode}',
    unsupportedOverflow: 'Unsupported overflow behavior: ${overflow}',
    unclosedQuote: 'The quote ${quote} is not closed',
    independentQuote: 'An alone quote ${quote} is used',
    noFormatToken: 'There is no format token',
    invalidFormatToken: 'Invalid format token: ${token}',
    noProperty: '${instance} does not have property ${property}: ${token}',
    noMethod: '${instance} does not have method ${method}',
    noDateTimeToken: 'There is no date or time format token',
    required12hoursWhenUsingAmPm:
        'When using AM/PM token (a), 12-hour token (h/hh) is also required',
    dontUseBoth12hoursAnd24Hours:
        'You cannot specify both 12-hour token (h/hh) and 24-hour token (H/HH)',
    requiredAmPmWhenUsing12hours:
        'When using 12-hour token (h/hh), AM/PM token (a) is also required',
    duplicateFormatToken: 'Duplicate format token: ${token}',
} as const satisfies Record<keyof typeof ja, string>;

export default messages;

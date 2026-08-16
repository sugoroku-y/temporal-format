import ja from './ja';

const messages = {
    /** Error when an unsupported locale name is specified */
    unsupportedLocale: 'Unsupported locale: ${locale}',
    /** Error when an unsupported calendar ID is specified */
    unsupportedCalendarId: 'Unsupported calendar ID: ${calendarId}',
    /** Error when monthCode has an unexpected value */
    invalidMonthCode: 'Unexpected monthCode: ${monthCode}',
    /** Error when an unsupported overflow behavior is specified */
    unsupportedOverflow: 'Unsupported overflow behavior: ${overflow}',
    /** Error when a quote is not closed */
    unclosedQuote: 'Unclosed quote: ${quote}',
    /** Error when a quote is used alone */
    independentQuote: 'Standalone quote used: ${quote}',
    /** Error when there is no format token */
    noFormatToken: 'No format token present',
    /** Error when an invalid format token is present */
    invalidFormatToken: 'Invalid format token: ${token}',
    /** Error when a property does not exist on the target instance */
    noProperty: '${instance} does not have property ${property}: ${token}',
    /** Error when a method does not exist on the target instance */
    noMethod: '${instance} does not have method ${method}',

    /** Error when there is no date or time format token */
    noDateTimeToken: 'No date or time format token present',
    /** Error when AM/PM is used but 12-hour token is missing */
    required12hoursWhenUsingAmPm:
        'When using AM/PM token (a), a 12-hour token (h/hh) is required',
    /** Error when both 12-hour and 24-hour tokens are used */
    dontUseBoth12hoursAnd24Hours:
        'Cannot specify both 12-hour token (h/hh) and 24-hour token (H/HH)',
    /** Error when 12-hour token is used but AM/PM token is missing */
    requiredAmPmWhenUsing12hours:
        'When using 12-hour token (h/hh), AM/PM token (a) is required',
    /** Error when a format token is duplicated */
    duplicateFormatToken: 'Duplicate format token: ${token}',
} as const satisfies Record<keyof typeof ja, string>;

export default messages;

import en from './en';
import ja from './ja';

// v8 ignore next メッセージの切り替えは環境変数で行うのでカバレッジの対象外
export const messages = (
    process.env.TEMPORAL_FORMAT_LANG === 'ja' ? ja : en
) as typeof process.env.TEMPORAL_FORMAT_LANG extends 'ja'
    ? typeof ja
    : typeof en;
export type MessageKey = keyof typeof messages;
export type MessageKeys = {
    [Key in MessageKey]: Key;
};
export const messageKeys: MessageKeys = Object.fromEntries(
    Object.keys(messages).map(key => [key, key]),
) as { [Key in MessageKey]: Key };

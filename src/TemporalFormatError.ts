import { expandTemplate, type TemplateParameter } from './expandTemplate';
import { type MessageKey, messages } from './messages';

export class TemporalFormatError<KEY extends MessageKey> extends Error {
    name = 'TemporalFormatError';
    constructor(
        key: KEY,
        ..._: (typeof messages)[KEY] extends `${string}$${string}`
            ? [params: TemplateParameter<(typeof messages)[KEY]>]
            : [params?: TemplateParameter<(typeof messages)[KEY]>]
    );
    constructor(
        key: KEY,
        params: TemplateParameter<
            (typeof messages)[KEY]
        > = {} as TemplateParameter<(typeof messages)[KEY]>,
    ) {
        super(expandTemplate(messages[key], params));
    }
}

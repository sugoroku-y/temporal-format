import { expandTemplate, type TemplateParameter } from './expandTemplate';
import { type MessageKey, messages } from './messages';
import type { AutoOmit } from './types';

export class TemporalFormatError<KEY extends MessageKey> extends Error {
    name = 'TemporalFormatError';
    constructor(
        key: KEY,
        ..._: AutoOmit<
            [
                Parameters<
                    typeof expandTemplate<
                        (typeof messages)[KEY],
                        TemplateParameter<(typeof messages)[KEY]>
                    >
                >[1],
            ]
        >
    );
    constructor(
        key: KEY,
        params: Partial<Record<string, string | number>> = {},
    ) {
        super(expandTemplate(messages[key], params as never));
    }
}

export function throwMessage<KEY extends MessageKey>(
    ...params: ConstructorParameters<typeof TemporalFormatError<KEY>>
): never {
    const error = new TemporalFormatError(...params);
    Error.captureStackTrace(error, throwMessage);
    throw error;
}

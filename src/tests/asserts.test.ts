import { assert } from '../asserts';

describe('assert', () => {
    it('success', () => {
        expect(() => assert(true)).not.toThrow();
    });
    it('failure', () => {
        expect(() => assert(false)).toThrow('Assertion failed');
    });
    it('failure with message', () => {
        expect(() => assert(false, 'test message')).toThrow('test message');
    });
});

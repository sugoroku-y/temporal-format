import { assert } from '../asserts';
import { lazy } from '../lazy';

describe('assert', () => {
    it('success', () => {
        expect(() => assert(true)).not.toThrow();
    });
    it('failure', () => {
        expect(() => assert(false)).toThrow('Assertion Failure');
    });
    it('failure with message', () => {
        expect(() => assert(false, 'test message')).toThrow('test message');
    });
    it('failure with message function', () => {
        expect(() => assert(false, lazy`abc${123}def`)).toThrow('abc123def');
    });
});

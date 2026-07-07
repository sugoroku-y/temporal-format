import { error } from '../error';

describe('error', () => {
    it('1', () => {
        expect(() => error('test')).toThrow('test');
    });
    it('2', () => {
        expect(() => error`abc${123}def`).toThrow('abc123def');
    });
    it('3', () => {
        expect(() => {
            try {
                void error`abc: ${new Error('test')}`;
                expect.fail();
            } catch (ex) {
                assert(ex instanceof Error);
                expect(ex.cause).toEqual(new Error('test'));
                throw ex;
            }
        }).toThrow('abc: test');
    });
});

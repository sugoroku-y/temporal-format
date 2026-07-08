import { error } from '../error';

describe('error', () => {
    it('1. throw Error with string', () => {
        expect(() => error('test')).toThrow('test');
    });
    it('2. throw Error with template literal', () => {
        expect(() => error`abc${123}def`).toThrow('abc123def');
    });
    it('3. rethrow Error', () => {
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
    it('4. throw Error with a truncated stacktrace', () => {
        const a = () => error`test${c}`;
        const b = () => a();
        const c = () => b();
        const d = () => c();
        try {
            d();
            expect.fail();
        } catch (ex) {
            assert(ex instanceof Error);
            expect(ex.stack).toEqual(
                expect.stringMatching(/^Error: test\n *at d \(/),
            );
        }
    });
});

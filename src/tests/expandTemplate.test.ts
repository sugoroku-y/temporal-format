import { expandTemplate } from '../expandTemplate';

describe('expandTemplate', () => {
    it('通常の使用方法', () => {
        expect(
            expandTemplate('abc${def}ghi${jkl}$${mno}', {
                def: '!"#',
                jkl: 456,
            }),
        ).toBe('abc!"#ghi456${mno}');
    });
    it('パラメーターなし', () => {
        expect(
            expandTemplate('abcdefghijklmno', { def: '!"#', jkl: 456 }),
        ).toBe('abcdefghijklmno');
    });
    it('存在しないパラメーターは空文字列に変換', () => {
        expect(
            expandTemplate(
                'abc${def}ghi${jkl}$${mno}',
                // @ts-expect-error 不足しているパラメーターを指定するため
                { def: '!"#' },
            ),
        ).toBe('abc!"#ghi${mno}');
    });
});

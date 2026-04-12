import { collectFormErrorMessages } from '../formValidationFeedback';

describe('collectFormErrorMessages', () => {
  it('returns trimmed messages in insertion order', () => {
    expect(
      collectFormErrorMessages({
        a: '  First  ',
        b: 'Second',
      }),
    ).toEqual(['First', 'Second']);
  });

  it('skips empty and undefined entries', () => {
    expect(
      collectFormErrorMessages({
        a: '',
        b: undefined,
        c: 'OK',
      }),
    ).toEqual(['OK']);
  });

  it('dedupes identical message strings', () => {
    expect(
      collectFormErrorMessages({
        a: 'Same',
        b: 'Same',
      }),
    ).toEqual(['Same']);
  });
});

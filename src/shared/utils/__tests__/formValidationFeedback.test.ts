import { collectFormErrorMessages, formatValidationFeedbackBody } from '../formValidationFeedback';

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

describe('formatValidationFeedbackBody', () => {
  it('returns the only message when there is one', () => {
    expect(formatValidationFeedbackBody('Intro', ['Only'])).toBe('Only');
  });

  it('returns intro and bullets when there are multiple messages', () => {
    expect(formatValidationFeedbackBody('Fix:', ['One', 'Two'])).toBe('Fix:\n\n• One\n• Two');
  });

  it('returns empty string when messages are empty', () => {
    expect(formatValidationFeedbackBody('Fix:', [])).toBe('');
  });
});

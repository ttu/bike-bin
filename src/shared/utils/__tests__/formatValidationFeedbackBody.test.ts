import { formatValidationFeedbackBody } from '../formValidationFeedback';

describe('formatValidationFeedbackBody', () => {
  it('returns the only message when there is one', () => {
    expect(formatValidationFeedbackBody('Intro', ['Only'])).toBe('Only');
  });

  it('returns intro and prefixed lines when there are multiple messages', () => {
    expect(formatValidationFeedbackBody('Fix:', ['One', 'Two'], '• ')).toBe('Fix:\n\n• One\n• Two');
  });

  it('uses empty bullet prefix by default for multiple messages', () => {
    expect(formatValidationFeedbackBody('Fix:', ['One', 'Two'])).toBe('Fix:\n\nOne\nTwo');
  });

  it('returns empty string when messages are empty', () => {
    expect(formatValidationFeedbackBody('Fix:', [])).toBe('');
  });
});

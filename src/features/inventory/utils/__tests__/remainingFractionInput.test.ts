import { formatRemainingPercentField, parseRemainingPercentInput } from '../remainingFractionInput';

describe('parseRemainingPercentInput', () => {
  it('returns undefined for empty input', () => {
    expect(parseRemainingPercentInput('')).toBeUndefined();
    expect(parseRemainingPercentInput('   ')).toBeUndefined();
  });

  it('parses integers 0–100 to fractions', () => {
    expect(parseRemainingPercentInput('0')).toBe(0);
    expect(parseRemainingPercentInput('50')).toBe(0.5);
    expect(parseRemainingPercentInput('100')).toBe(1);
  });

  it('returns undefined for out-of-range or non-integers', () => {
    expect(parseRemainingPercentInput('-1')).toBeUndefined();
    expect(parseRemainingPercentInput('101')).toBeUndefined();
    expect(parseRemainingPercentInput('12.5')).toBeUndefined();
    expect(parseRemainingPercentInput('abc')).toBeUndefined();
  });
});

describe('formatRemainingPercentField', () => {
  it('returns empty string when unset', () => {
    expect(formatRemainingPercentField(undefined)).toBe('');
  });

  it('rounds fraction to whole percent', () => {
    expect(formatRemainingPercentField(0.333)).toBe('33');
    expect(formatRemainingPercentField(1)).toBe('100');
  });
});

import { optionalNumberFromInput } from '../optionalNumberFromInput';

describe('optionalNumberFromInput', () => {
  it('returns empty valid for blank input', () => {
    expect(optionalNumberFromInput('')).toEqual({ value: undefined, invalid: false });
    expect(optionalNumberFromInput('  ')).toEqual({ value: undefined, invalid: false });
  });

  it('parses integers and decimals with comma or dot', () => {
    expect(optionalNumberFromInput('12')).toEqual({ value: 12, invalid: false });
    expect(optionalNumberFromInput('12.5')).toEqual({ value: 12.5, invalid: false });
    expect(optionalNumberFromInput('12,5')).toEqual({ value: 12.5, invalid: false });
  });

  it('marks negative and non-finite as invalid', () => {
    expect(optionalNumberFromInput('-1')).toEqual({ value: undefined, invalid: true });
    expect(optionalNumberFromInput('x')).toEqual({ value: undefined, invalid: true });
    expect(optionalNumberFromInput('Infinity')).toEqual({ value: undefined, invalid: true });
    expect(optionalNumberFromInput('12abc')).toEqual({ value: undefined, invalid: true });
  });
});

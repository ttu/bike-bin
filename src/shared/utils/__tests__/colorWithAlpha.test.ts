import { colorWithAlpha } from '../colorWithAlpha';

describe('colorWithAlpha', () => {
  it('appends alpha hex for common opacity values', () => {
    expect(colorWithAlpha('#006857', 0.15)).toBe('#00685726');
    expect(colorWithAlpha('#006857', 0.25)).toBe('#00685740');
    expect(colorWithAlpha('#006857', 0.08)).toBe('#00685714');
  });

  it('handles edge values', () => {
    expect(colorWithAlpha('#ffffff', 0)).toBe('#ffffff00');
    expect(colorWithAlpha('#000000', 1)).toBe('#000000ff');
  });

  it('pads single-digit alpha with leading zero', () => {
    expect(colorWithAlpha('#ff0000', 0.01)).toBe('#ff000003');
  });
});

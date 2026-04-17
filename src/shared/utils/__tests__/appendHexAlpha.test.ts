import { appendHexAlpha } from '../appendHexAlpha';

describe('appendHexAlpha', () => {
  it('appends alpha to 6-digit hex', () => {
    expect(appendHexAlpha('#bccac4', '26')).toBe('#bccac426');
  });

  it('expands 3-digit hex then appends alpha', () => {
    expect(appendHexAlpha('#abc', '26')).toBe('#aabbcc26');
  });

  it('returns non-hex colors unchanged', () => {
    expect(appendHexAlpha('rgba(0,0,0,0.15)', '26')).toBe('rgba(0,0,0,0.15)');
  });
});

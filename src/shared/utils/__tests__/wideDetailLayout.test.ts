import { Platform } from 'react-native';
import { getWideDetailLayout, WIDE_DETAIL_BREAKPOINT } from '../wideDetailLayout';

describe('getWideDetailLayout', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      value: originalOs,
      configurable: true,
      writable: true,
    });
  });

  it('returns splitLayout on web when viewport is wide', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true, writable: true });
    const r = getWideDetailLayout(WIDE_DETAIL_BREAKPOINT + 200);
    expect(r.isWide).toBe(true);
    expect(r.splitLayout).toBe(true);
    expect(r.galleryMaxWidth).toBeDefined();
    expect(r.galleryMaxWidth).toBeGreaterThanOrEqual(280);
  });

  it('does not split on native when viewport is wide', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true, writable: true });
    const r = getWideDetailLayout(WIDE_DETAIL_BREAKPOINT + 200);
    expect(r.isWide).toBe(true);
    expect(r.splitLayout).toBe(false);
    expect(r.galleryMaxWidth).toBeDefined();
  });

  it('does not use wide layout when viewport is narrow', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true, writable: true });
    const r = getWideDetailLayout(WIDE_DETAIL_BREAKPOINT - 1);
    expect(r.isWide).toBe(false);
    expect(r.splitLayout).toBe(false);
    expect(r.galleryMaxWidth).toBeUndefined();
  });
});

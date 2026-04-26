import { Platform } from 'react-native';
import { getWebViewportStyle } from '../webViewportStyle';

describe('getWebViewportStyle', () => {
  it('returns full-viewport styles on web', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    expect(getWebViewportStyle()).toEqual({
      flex: 1,
      width: '100%',
      minHeight: '100vh',
    });
  });

  it('returns undefined on native', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    expect(getWebViewportStyle()).toBeUndefined();
  });
});

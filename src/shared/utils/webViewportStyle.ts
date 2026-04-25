import { Platform, type ViewStyle } from 'react-native';

/**
 * Root layout style so the app fills the browser viewport on web (avoids a narrow
 * column with empty space on wider tablet/desktop windows).
 */
export function getWebViewportStyle(): ViewStyle | undefined {
  if (Platform.OS === 'web') {
    return {
      flex: 1,
      width: '100%',
      minHeight: '100vh',
    } as unknown as ViewStyle;
  }
  return undefined;
}

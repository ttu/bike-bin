import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

/**
 * Bottom tabs use react-native-screens to hide inactive routes (display: none on web).
 * On web, `screensEnabled` defaults to false, so inactive tab scenes stay mounted as plain
 * absolute views and can paint or intercept above the focused tab.
 */
export function configureNavigationForWeb(): void {
  if (Platform.OS === 'web') {
    enableScreens(true);
  }
}

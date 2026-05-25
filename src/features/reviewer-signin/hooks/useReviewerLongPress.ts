import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const REVIEWER_LONG_PRESS_MS = 1500;

interface ReviewerLongPressHandlers {
  readonly onLongPress: () => void;
  readonly delayLongPress: number;
}

/**
 * Spread the return value onto a Pressable wrapping the Socket BB mark on the
 * welcome screen. Fires a subtle haptic the instant the threshold is crossed
 * so an App Store reviewer holding the logo knows they've held long enough.
 */
export function useReviewerLongPress(onTriggered: () => void): ReviewerLongPressHandlers {
  const onLongPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    onTriggered();
  }, [onTriggered]);

  return {
    onLongPress,
    delayLongPress: REVIEWER_LONG_PRESS_MS,
  };
}

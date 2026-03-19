import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { ReactNode } from 'react';

const MAX_WIDTH = 480;

interface MaxWidthContainerProps {
  children: ReactNode;
}

/**
 * Wraps content with a max width of 480px, centered on web.
 * On native platforms, renders children without constraints.
 * The outer background uses surfaceVariant on web to visually
 * distinguish the app column from the desktop background.
 */
export function MaxWidthContainer({ children }: MaxWidthContainerProps) {
  const theme = useTheme();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={[styles.outer, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={[styles.inner, { backgroundColor: theme.colors.background }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
  },
});

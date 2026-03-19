import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

/**
 * Banner shown at the top of the screen when the device is offline.
 * Dismissible by the user, but reappears on next offline event.
 */
export function OfflineBanner() {
  const theme = useTheme();
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
      <MaterialCommunityIcons
        name="wifi-off"
        size={iconSize.sm}
        color={theme.colors.onErrorContainer}
      />
      <Text variant="bodySmall" style={[styles.text, { color: theme.colors.onErrorContainer }]}>
        You are offline. Some features may be unavailable.
      </Text>
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <MaterialCommunityIcons
          name="close"
          size={iconSize.sm}
          color={theme.colors.onErrorContainer}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
  },
  text: {
    flex: 1,
  },
});

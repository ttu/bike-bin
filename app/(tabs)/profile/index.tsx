import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('tabs.profile')}
        </Text>
      </View>

      {/* Saved Locations */}
      <Pressable
        onPress={() => router.push('/(tabs)/profile/locations' as never)}
        style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="map-marker" size={iconSize.md} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
          {t('locations:title', { defaultValue: 'Saved Locations' })}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
  },
});

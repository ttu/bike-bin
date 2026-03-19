import { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import { Text, Switch, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { useNotificationPreferences } from '@/features/notifications';
import type { NotificationPreferences } from '@/features/notifications';

type CategoryKey = keyof NotificationPreferences;
type ChannelKey = 'push' | 'email';

const CATEGORIES: CategoryKey[] = ['messages', 'borrowActivity', 'reminders'];

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('notifications');
  const insets = useSafeAreaInsets();

  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

  const handleToggle = useCallback(
    (category: CategoryKey, channel: ChannelKey, value: boolean) => {
      const updated: NotificationPreferences = {
        ...preferences,
        [category]: {
          ...preferences[category],
          [channel]: value,
        },
      };
      updatePreferences(updated);
    },
    [preferences, updatePreferences],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={iconSize.md}
            color={theme.colors.onBackground}
          />
        </Pressable>
        <Text
          variant="headlineMedium"
          style={[styles.headerTitle, { color: theme.colors.onBackground }]}
        >
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('settings.description')}
        </Text>

        {CATEGORIES.map((category) => (
          <View
            key={category}
            style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {t(`settings.categories.${category}`)}
            </Text>

            <View style={styles.toggleRow}>
              <Text
                variant="bodyMedium"
                style={[styles.toggleLabel, { color: theme.colors.onSurface }]}
              >
                {t('settings.channels.push')}
              </Text>
              <Switch
                value={preferences[category].push}
                onValueChange={(value) => handleToggle(category, 'push', value)}
                disabled={isLoading || Platform.OS === 'web'}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text
                variant="bodyMedium"
                style={[styles.toggleLabel, { color: theme.colors.onSurface }]}
              >
                {t('settings.channels.email')}
              </Text>
              <Switch
                value={preferences[category].email}
                onValueChange={(value) => handleToggle(category, 'email', value)}
                disabled={isLoading}
              />
            </View>
          </View>
        ))}

        <Text variant="bodySmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
          {t('settings.inAppNote')}
        </Text>

        {Platform.OS === 'web' && (
          <Text variant="bodySmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
            {t('settings.pushNotAvailable')}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    gap: spacing.md,
  },
  description: {
    marginBottom: spacing.sm,
  },
  categoryCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    flex: 1,
  },
  note: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});

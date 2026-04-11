import { useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { Appbar, Text, Switch, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { spacing, borderRadius } from '@/shared/theme';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { useNotificationPreferences } from '@/features/notifications';
import type { NotificationPreferences } from '@/features/notifications';

type CategoryKey = keyof NotificationPreferences;
type ChannelKey = 'push' | 'email';

const CATEGORIES: CategoryKey[] = ['messages', 'borrowActivity', 'reminders'];

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('notifications');
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

  const themedStyles = useMemo(
    () => ({
      screen: { backgroundColor: theme.colors.background },
      appbar: { backgroundColor: theme.colors.background },
      description: { color: theme.colors.onSurfaceVariant },
      categoryCard: { backgroundColor: theme.colors.surface },
      categoryTitle: { color: theme.colors.onSurface },
      toggleLabel: { color: theme.colors.onSurface },
      note: { color: theme.colors.onSurfaceVariant },
    }),
    [theme],
  );

  return (
    <View style={[styles.container, themedStyles.screen]}>
      <Appbar.Header dark={theme.dark} style={themedStyles.appbar}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      {isLoading ? (
        <CenteredLoadingIndicator />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="bodyMedium" style={[styles.description, themedStyles.description]}>
            {t('settings.description')}
          </Text>

          {CATEGORIES.map((category) => (
            <View key={category} style={[styles.categoryCard, themedStyles.categoryCard]}>
              <Text variant="titleMedium" style={themedStyles.categoryTitle}>
                {t(`settings.categories.${category}`)}
              </Text>

              <View style={styles.toggleRow}>
                <Text variant="bodyMedium" style={[styles.toggleLabel, themedStyles.toggleLabel]}>
                  {t('settings.channels.push')}
                </Text>
                <Switch
                  value={preferences[category].push}
                  onValueChange={(value) => handleToggle(category, 'push', value)}
                  disabled={Platform.OS === 'web'}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text variant="bodyMedium" style={[styles.toggleLabel, themedStyles.toggleLabel]}>
                  {t('settings.channels.email')}
                </Text>
                <Switch
                  value={preferences[category].email}
                  onValueChange={(value) => handleToggle(category, 'email', value)}
                />
              </View>
            </View>
          ))}

          <Text variant="bodySmall" style={[styles.note, themedStyles.note]}>
            {t('settings.inAppNote')}
          </Text>

          {Platform.OS === 'web' && (
            <Text variant="bodySmall" style={[styles.note, themedStyles.note]}>
              {t('settings.pushNotAvailable')}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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

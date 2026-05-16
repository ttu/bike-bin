import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { spacing, type AppTheme } from '@/shared/theme';
import { useAuth } from '../../hooks/useAuth';

export function SyncBanner() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation('auth');
  const theme = useTheme<AppTheme>();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.outlineVariant,
        },
        message: { color: theme.colors.onSurfaceVariant },
        link: { color: theme.colors.primary },
      }),
    [theme],
  );

  if (isAuthenticated) return null;

  return (
    <View style={[styles.container, themed.container]}>
      <Icon source="cloud-off-outline" size={18} color={theme.colors.onSurfaceVariant} />
      <Text variant="bodyMedium" style={[styles.message, themed.message]}>
        {t('syncBanner.message')}
      </Text>
      <Pressable
        onPress={() => router.push('/(auth)/login')}
        accessibilityRole="link"
        accessibilityLabel={t('syncBanner.signIn')}
        hitSlop={spacing.xs}
      >
        <Text variant="bodyMedium" style={[styles.link, themed.link]}>
          {t('syncBanner.signIn')}
        </Text>
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
  },
  message: {
    flexShrink: 1,
  },
  link: {
    fontWeight: '600',
  },
});

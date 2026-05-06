import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Banner, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { AppTheme } from '@/shared/theme';
import { useAuth } from '../../hooks/useAuth';

export function SyncBanner() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation('auth');
  const theme = useTheme<AppTheme>();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        banner: { backgroundColor: theme.customColors.warningContainer },
      }),
    [theme],
  );

  if (isAuthenticated) return null;

  return (
    <Banner
      visible
      icon="cloud-off-outline"
      style={themed.banner}
      actions={[
        {
          label: t('syncBanner.signIn'),
          onPress: () => router.push('/(auth)/login'),
        },
      ]}
    >
      {t('syncBanner.message')}
    </Banner>
  );
}

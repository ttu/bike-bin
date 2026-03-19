import { Banner, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { AppTheme } from '@/shared/theme';
import { useAuth } from '../../hooks/useAuth';

export function SyncBanner() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation('auth');
  const theme = useTheme<AppTheme>();

  if (isAuthenticated) return null;

  return (
    <Banner
      visible
      icon="cloud-off-outline"
      style={{ backgroundColor: theme.customColors.warningContainer }}
      actions={[
        {
          label: t('syncBanner.signIn', 'Sign in'),
          onPress: () => router.push('/(auth)/login'),
        },
      ]}
    >
      {t(
        'syncBanner.message',
        'Your items are saved on this device only. Sign in to sync and share them.',
      )}
    </Banner>
  );
}

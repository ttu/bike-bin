import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export function SyncBanner() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation('auth');

  if (isAuthenticated) return null;

  return (
    <Banner
      visible
      icon="cloud-off-outline"
      style={styles.banner}
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

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF3E0',
  },
});

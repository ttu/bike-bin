import { View, ScrollView, StyleSheet, Share, Platform, Linking } from 'react-native';
import { Appbar, Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { spacing, borderRadius } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import { useRequestExport, useLatestExport } from '@/features/profile';
import { ExportRequestStatus } from '@/shared/types';
import { supabase } from '@/shared/api/supabase';
import type { ExportRequest, UserId } from '@/shared/types';

type ScreenState = 'ready' | 'requesting' | 'processing' | 'download' | 'failed' | 'rateLimited';

function deriveState(
  latestExport: ExportRequest | null | undefined,
  isRequesting: boolean,
  requestError: Error | null,
): ScreenState {
  if (requestError?.message === 'Too many requests') return 'rateLimited';
  if (isRequesting) return 'requesting';
  if (!latestExport) return 'ready';

  switch (latestExport.status) {
    case ExportRequestStatus.Pending:
    case ExportRequestStatus.Processing:
      return 'processing';
    case ExportRequestStatus.Completed: {
      if (latestExport.expiresAt && new Date(latestExport.expiresAt) < new Date()) {
        return 'ready'; // expired
      }
      return 'download';
    }
    case ExportRequestStatus.Failed:
      return 'failed';
    default:
      return 'ready';
  }
}

function hoursUntilExpiry(expiresAt: string | undefined): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (60 * 60 * 1000)));
}

export default function ExportDataScreen() {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  const { user } = useAuth();
  const userId = (user?.id ?? '') as UserId;

  const { data: latestExport, isLoading } = useLatestExport(userId || undefined);
  const requestExport = useRequestExport();
  const screenState = deriveState(latestExport, requestExport.isPending, requestExport.error);

  const handleExport = () => {
    requestExport.mutate();
  };

  const handleDownload = async () => {
    if (!latestExport?.storagePath) return;

    const { data, error } = await supabase.storage
      .from('data-exports')
      .createSignedUrl(latestExport.storagePath, 3600); // 1h signed URL

    if (error || !data?.signedUrl) return;

    if (Platform.OS === 'web') {
      await Linking.openURL(data.signedUrl);
      return;
    }

    const fileUri = `${cacheDirectory}bike-bin-export.zip`;
    const download = await downloadAsync(data.signedUrl, fileUri);

    if (download.status === 200) {
      await Share.share({ url: download.uri, title: t('export.title') });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
          <Appbar.Content title={t('export.title')} />
        </Appbar.Header>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
        <Appbar.Content title={t('export.title')} />
      </Appbar.Header>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
          {t('export.title')}
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('export.description')}
        </Text>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('export.included')}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('export.includedItems')}
          </Text>
        </View>

        {screenState === 'ready' && (
          <Button mode="contained" onPress={handleExport} style={styles.button}>
            {t('export.button')}
          </Button>
        )}

        {screenState === 'requesting' && (
          <Button mode="contained" disabled loading style={styles.button}>
            {t('export.requesting')}
          </Button>
        )}

        {screenState === 'processing' && (
          <View style={[styles.statusCard, { backgroundColor: theme.colors.secondaryContainer }]}>
            <ActivityIndicator size="small" />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              {t('export.processing')}
            </Text>
          </View>
        )}

        {screenState === 'download' && (
          <View style={styles.downloadSection}>
            <View style={[styles.statusCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('export.readyTitle')}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('export.readyMessage')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('export.expiresIn', { hours: hoursUntilExpiry(latestExport?.expiresAt) })}
              </Text>
            </View>
            <Button mode="contained" onPress={handleDownload} style={styles.button}>
              {t('export.download')}
            </Button>
          </View>
        )}

        {screenState === 'failed' && (
          <View style={styles.downloadSection}>
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {t('export.failed')}
            </Text>
            <Button mode="contained" onPress={handleExport} style={styles.button}>
              {t('export.retry')}
            </Button>
          </View>
        )}

        {screenState === 'rateLimited' && (
          <View style={[styles.statusCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('export.rateLimited', { time: '24 hours' })}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.base,
    gap: spacing.base,
  },
  description: {
    lineHeight: 22,
  },
  infoCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statusCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
  downloadSection: {
    gap: spacing.md,
  },
});

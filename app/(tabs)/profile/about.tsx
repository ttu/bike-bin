import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Appbar, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { spacing } from '@/shared/theme';

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('profile');

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('about.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <List.Item
          title={t('about.appVersion')}
          description={appVersion}
          left={(props) => <List.Icon {...props} icon="information-outline" />}
        />

        <List.Item
          title={t('about.termsOfService')}
          left={(props) => <List.Icon {...props} icon="file-document-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL('https://bikebin.app/terms')}
        />

        <List.Item
          title={t('about.privacyPolicy')}
          left={(props) => <List.Icon {...props} icon="shield-lock-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL('https://bikebin.app/privacy')}
        />

        <List.Item
          title={t('about.openSourceLicenses')}
          left={(props) => <List.Icon {...props} icon="open-source-initiative" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Linking.openURL('https://bikebin.app/licenses')}
        />

        <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
          {t('about.madeWith')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
});

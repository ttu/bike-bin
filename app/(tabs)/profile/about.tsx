import type { ComponentProps } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { BrandLockup } from '@/shared/components/BrandLockup';
import { spacing } from '@/shared/theme';

type ListIconProps = ComponentProps<typeof List.Icon>;
type ListItemIconProps = Omit<ListIconProps, 'icon'>;

function InfoIcon(props: ListItemIconProps) {
  return <List.Icon {...props} icon="information-outline" />;
}
function TermsIcon(props: ListItemIconProps) {
  return <List.Icon {...props} icon="file-document-outline" />;
}
function PrivacyIcon(props: ListItemIconProps) {
  return <List.Icon {...props} icon="shield-lock-outline" />;
}
function LicensesIcon(props: ListItemIconProps) {
  return <List.Icon {...props} icon="open-source-initiative" />;
}
function ChevronRightIcon(props: ListItemIconProps) {
  return <List.Icon {...props} icon="chevron-right" />;
}

export default function AboutScreen() {
  const theme = useTheme();
  const { t } = useTranslation('profile');

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
        <Appbar.Content title={t('about.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <List.Item title={t('about.appVersion')} description={appVersion} left={InfoIcon} />

        <List.Item
          title={t('about.termsOfService')}
          left={TermsIcon}
          right={ChevronRightIcon}
          onPress={() => Linking.openURL('https://bikebin.app/terms')}
        />

        <List.Item
          title={t('about.privacyPolicy')}
          left={PrivacyIcon}
          right={ChevronRightIcon}
          onPress={() => Linking.openURL('https://bikebin.app/privacy')}
        />

        <List.Item
          title={t('about.openSourceLicenses')}
          left={LicensesIcon}
          right={ChevronRightIcon}
          onPress={() => Linking.openURL('https://bikebin.app/licenses')}
        />

        <View style={styles.brandFooter}>
          <BrandLockup
            caption={t('about.lockupCaption')}
            accessibilityLabel={`Bike Bin · ${t('about.lockupCaption')}`}
          />
          <Text
            variant="bodySmall"
            style={[styles.madeWith, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('about.madeWith')}
          </Text>
        </View>
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
  brandFooter: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.base,
  },
  madeWith: {
    textAlign: 'center',
  },
});

import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SocketBBMark } from '@/shared/components';
import { spacing, type AppTheme } from '@/shared/theme';

const RULE_WIDTH = 72;
const LOGO_SIZE = 64;
const DESCRIPTION_MAX_WIDTH = 320;

interface LoginMastheadProps {
  /** Long-press on the logo reveals the reviewer sign-in sheet. */
  readonly onLogoLongPress: () => void;
  readonly logoLongPressDelay: number;
}

/** Logo, rule and welcome copy at the top of the login screen. */
export function LoginMasthead({ onLogoLongPress, logoLongPressDelay }: LoginMastheadProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('auth');
  const themed = useThemedStyles(theme);

  return (
    <View style={styles.masthead}>
      <Pressable
        onLongPress={onLogoLongPress}
        delayLongPress={logoLongPressDelay}
        testID="reviewer-signin-trigger"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SocketBBMark size={LOGO_SIZE} />
      </Pressable>
      <View style={[styles.rule, themed.rule]} />
      <Text variant="displayLarge" style={[styles.title, themed.onBackground]}>
        {t('welcome.title')}
      </Text>
      <Text variant="bodyLarge" style={[styles.tagline, themed.onSurfaceVariant]}>
        {t('welcome.tagline')}
      </Text>
      <Text variant="bodyMedium" style={[styles.description, themed.onSurfaceVariant]}>
        {t('welcome.description')}
      </Text>
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        rule: { backgroundColor: theme.colors.outlineVariant },
        onBackground: { color: theme.colors.onBackground },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  masthead: {
    alignItems: 'flex-start',
  },
  title: {
    letterSpacing: -1.5,
    textTransform: 'uppercase',
    lineHeight: 56,
  },
  tagline: {
    marginTop: spacing.base,
    fontWeight: '600',
  },
  description: {
    marginTop: spacing.sm,
    maxWidth: DESCRIPTION_MAX_WIDTH,
  },
  rule: {
    width: RULE_WIDTH,
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});

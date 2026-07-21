import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/shared/api/supabase';
import { TEST_USERS, TEST_USER_PASSWORD, MAIN_TEST_USER } from '@/shared/constants/testUsers';
import { isPasswordDemoLoginEnabled } from '@/shared/utils/env';
import { isAppleSignInEnabled } from '@/shared/utils/featureFlags';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';

const ACTION_HEIGHT = 48;

interface LoginActionPanelProps {
  readonly onSignInWithApple: () => void;
  readonly onSignInWithGoogle: () => void;
  readonly onBrowseWithout: () => void;
  readonly onTryDemo: () => void;
}

/**
 * Sign-in actions on the login screen: the provider buttons, the browse-without
 * escape hatch, and — when password demo login is enabled — the dev user picker.
 */
export function LoginActionPanel({
  onSignInWithApple,
  onSignInWithGoogle,
  onBrowseWithout,
  onTryDemo,
}: LoginActionPanelProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('auth');
  const { t: tDemo } = useTranslation('demo');
  const [isDevExpanded, setIsDevExpanded] = useState(false);
  const [signingInAs, setSigningInAs] = useState<string | undefined>(undefined);
  const themed = useThemedStyles(theme);
  const googleForeground = isAppleSignInEnabled ? theme.colors.onSurface : theme.colors.background;

  const handleDevLogin = async (email: string) => {
    setSigningInAs(email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: TEST_USER_PASSWORD,
      });
      if (error) {
        console.error('Dev login failed:', error.message);
        setSigningInAs(undefined);
        return;
      }
      router.replace('/(tabs)/inventory');
    } catch (e) {
      console.error('Dev login error:', e);
      setSigningInAs(undefined);
    }
  };

  const devLoginBusy = signingInAs !== undefined;

  return (
    <View style={styles.bottomGroup}>
      <View style={styles.actions}>
        {isAppleSignInEnabled && (
          <Pressable
            onPress={onSignInWithApple}
            style={({ pressed }) => [
              styles.primaryAction,
              themed.primaryAction,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.continueWithApple')}
          >
            <MaterialCommunityIcons name="apple" size={20} color={theme.colors.background} />
            <Text variant="labelLarge" style={[styles.actionLabel, themed.onPrimaryAction]}>
              {t('welcome.continueWithApple')}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.background} />
          </Pressable>
        )}

        {/* Google is the filled primary action whenever Apple is hidden. */}
        <Pressable
          onPress={onSignInWithGoogle}
          style={({ pressed }) => [
            isAppleSignInEnabled ? styles.secondaryAction : styles.primaryAction,
            isAppleSignInEnabled ? themed.secondaryAction : themed.primaryAction,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('welcome.continueWithGoogle')}
        >
          <MaterialCommunityIcons name="google" size={20} color={googleForeground} />
          <Text variant="labelLarge" style={[styles.actionLabel, themed.googleLabel]}>
            {t('welcome.continueWithGoogle')}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={googleForeground} />
        </Pressable>

        <Pressable
          onPress={onBrowseWithout}
          style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text variant="labelLarge" style={[styles.actionLabel, themed.primary]}>
            {t('welcome.browseWithout')}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, themed.dividerLine]} />
        <Text variant="labelSmall" style={themed.onSurfaceVariant}>
          {t('welcome.or')}
        </Text>
        <View style={[styles.dividerLine, themed.dividerLine]} />
      </View>

      <View style={styles.secondaryRow}>
        <Pressable
          onPress={onTryDemo}
          style={({ pressed }) => [styles.chipButton, themed.chipButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="play-circle-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text variant="labelMedium" style={themed.primary}>
            {tDemo('welcome.tryDemo')}
          </Text>
        </Pressable>

        {isPasswordDemoLoginEnabled && (
          <Pressable
            onPress={() => handleDevLogin(MAIN_TEST_USER.email)}
            disabled={devLoginBusy}
            style={({ pressed }) => [
              styles.chipButton,
              themed.chipButton,
              pressed && styles.pressed,
              devLoginBusy && styles.disabled,
            ]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="bug-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="labelMedium" style={themed.onSurfaceVariant}>
              {t('devLogin.button')}
            </Text>
          </Pressable>
        )}
      </View>

      {isPasswordDemoLoginEnabled && (
        <View style={styles.devSection}>
          <Button
            mode="text"
            onPress={() => setIsDevExpanded(!isDevExpanded)}
            compact
            icon={isDevExpanded ? 'chevron-up' : 'chevron-down'}
            textColor={theme.colors.onSurfaceVariant}
          >
            {t('devLogin.otherUsers')}
          </Button>
          {isDevExpanded &&
            TEST_USERS.filter((u) => !u.isMain).map((user) => (
              <Button
                key={user.id}
                mode="text"
                onPress={() => handleDevLogin(user.email)}
                loading={signingInAs === user.email}
                disabled={devLoginBusy}
                compact
                style={styles.devUserButton}
                textColor={theme.colors.onSurfaceVariant}
              >
                {user.displayName} ({user.persona})
              </Button>
            ))}
        </View>
      )}
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        primaryAction: { backgroundColor: theme.colors.onBackground },
        onPrimaryAction: { color: theme.colors.background },
        secondaryAction: { borderColor: theme.colors.outline },
        dividerLine: { backgroundColor: theme.colors.outlineVariant },
        chipButton: { backgroundColor: theme.customColors.surfaceContainerLow },
        googleLabel: {
          color: isAppleSignInEnabled ? theme.colors.onSurface : theme.colors.background,
        },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  bottomGroup: {
    gap: spacing.base,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: ACTION_HEIGHT,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: ACTION_HEIGHT,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: ACTION_HEIGHT,
    paddingHorizontal: spacing.base,
  },
  actionLabel: {
    flex: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  devSection: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  devUserButton: {
    alignSelf: 'flex-start',
  },
});

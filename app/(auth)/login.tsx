import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/features/auth';
import { useDemoMode } from '@/features/demo';
import { supabase } from '@/shared/api/supabase';
import { TEST_USERS, TEST_USER_PASSWORD, MAIN_TEST_USER } from '@/shared/constants/testUsers';
import { isPasswordDemoLoginEnabled } from '@/shared/utils/env';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

const MAX_CONTENT_WIDTH = 480;
const RULE_WIDTH = 56;
const ACTION_HEIGHT = 48;

export default function LoginScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('auth');
  const { t: tDemo } = useTranslation('demo');
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { enterDemoMode } = useDemoMode();
  const [isDevExpanded, setIsDevExpanded] = useState(false);
  const [signingInAs, setSigningInAs] = useState<string | null>(null);
  const themed = useThemedStyles(theme);

  const handleDevLogin = async (email: string) => {
    setSigningInAs(email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: TEST_USER_PASSWORD,
      });
      if (error) {
        console.error('Dev login failed:', error.message);
        setSigningInAs(null);
        return;
      }
      router.replace('/(tabs)/inventory');
    } catch (e) {
      console.error('Dev login error:', e);
      setSigningInAs(null);
    }
  };

  const handleBrowseWithout = () => {
    router.replace('/(tabs)/inventory');
  };

  const handleTryDemo = () => {
    enterDemoMode();
    router.replace('/(tabs)/inventory');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Masthead */}
          <View style={styles.masthead}>
            <Text variant="displayLarge" style={[styles.title, themed.onBackground]}>
              {t('welcome.title')}
            </Text>
            <View style={[styles.rule, { backgroundColor: theme.colors.outline }]} />
            <Text variant="bodyLarge" style={themed.onSurfaceVariant}>
              {t('welcome.tagline')}
            </Text>
          </View>

          {/* Bottom group: actions, divider, demo/dev, expandable users */}
          <View style={styles.bottomGroup}>
            <View style={styles.actions}>
              <Pressable
                onPress={signInWithApple}
                style={({ pressed }) => [
                  styles.primaryAction,
                  { backgroundColor: theme.colors.onBackground },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('welcome.continueWithApple')}
              >
                <MaterialCommunityIcons name="apple" size={20} color={theme.colors.background} />
                <Text
                  variant="labelLarge"
                  style={[styles.actionLabel, { color: theme.colors.background }]}
                >
                  {t('welcome.continueWithApple')}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color={theme.colors.background}
                />
              </Pressable>

              <Pressable
                onPress={signInWithGoogle}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  { borderColor: theme.colors.outline },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('welcome.continueWithGoogle')}
              >
                <MaterialCommunityIcons name="google" size={20} color={theme.colors.onSurface} />
                <Text variant="labelLarge" style={[styles.actionLabel, themed.onSurface]}>
                  {t('welcome.continueWithGoogle')}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color={theme.colors.onSurface}
                />
              </Pressable>

              <Pressable
                onPress={handleBrowseWithout}
                style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text variant="labelLarge" style={[styles.actionLabel, themed.primary]}>
                  {t('welcome.browseWithout')}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.primary} />
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]}
              />
              <Text variant="labelSmall" style={themed.onSurfaceVariant}>
                {t('welcome.or')}
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]}
              />
            </View>

            {/* Demo + Dev row */}
            <View style={styles.secondaryRow}>
              <Pressable
                onPress={handleTryDemo}
                style={({ pressed }) => [
                  styles.chipButton,
                  { backgroundColor: theme.customColors.surfaceContainerLow },
                  pressed && styles.pressed,
                ]}
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
                  disabled={signingInAs !== null}
                  style={({ pressed }) => [
                    styles.chipButton,
                    { backgroundColor: theme.customColors.surfaceContainerLow },
                    pressed && styles.pressed,
                    signingInAs !== null && styles.disabled,
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

            {/* Dev expandable users */}
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
                      disabled={signingInAs !== null}
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
        </View>
      </ScrollView>
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onBackground: { color: theme.colors.onBackground },
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  masthead: {
    alignItems: 'flex-start',
  },
  title: {
    letterSpacing: -1,
    marginBottom: spacing.base,
  },
  rule: {
    width: RULE_WIDTH,
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
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

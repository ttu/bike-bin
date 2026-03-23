import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/features/auth';
import { useDemoMode } from '@/features/demo';
import { supabase } from '@/shared/api/supabase';
import { TEST_USERS, TEST_USER_PASSWORD, MAIN_TEST_USER } from '@/shared/constants/testUsers';
import { isProduction } from '@/shared/utils/env';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

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
    <LinearGradient
      colors={[theme.colors.primaryContainer, theme.colors.background, theme.colors.background]}
      locations={[0, 0.4, 1]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.customColors.surfaceContainerLowest },
            ]}
          >
            <MaterialCommunityIcons name="bike" size={56} color={theme.colors.primary} />
          </View>
          <Text variant="displaySmall" style={themed.onBackground}>
            {t('welcome.title')}
          </Text>
          <Text variant="labelLarge" style={[styles.tagline, themed.onSurfaceVariant]}>
            {t('welcome.tagline')}
          </Text>
        </View>

        {/* Auth buttons card */}
        <View
          style={[styles.authCard, { backgroundColor: theme.customColors.surfaceContainerLowest }]}
        >
          <Pressable
            onPress={signInWithApple}
            style={({ pressed }) => [
              styles.appleButton,
              { backgroundColor: theme.colors.onBackground },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.continueWithApple')}
          >
            <MaterialCommunityIcons name="apple" size={20} color={theme.colors.background} />
            <Text variant="labelLarge" style={{ color: theme.colors.background }}>
              {t('welcome.continueWithApple')}
            </Text>
          </Pressable>

          <Pressable
            onPress={signInWithGoogle}
            style={({ pressed }) => [
              styles.googleButton,
              { borderColor: theme.colors.outlineVariant },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.continueWithGoogle')}
          >
            <MaterialCommunityIcons name="google" size={20} color={theme.colors.onSurface} />
            <Text variant="labelLarge" style={themed.onSurface}>
              {t('welcome.continueWithGoogle')}
            </Text>
          </Pressable>
        </View>

        {/* Browse without signing in */}
        <Button mode="text" onPress={handleBrowseWithout} textColor={theme.colors.primary}>
          {t('welcome.browseWithout')}
        </Button>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
          <Text variant="labelSmall" style={themed.onSurfaceVariant}>
            OR
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
        </View>

        {/* Demo + Dev row */}
        <View style={styles.secondaryRow}>
          <Pressable
            onPress={handleTryDemo}
            style={({ pressed }) => [
              styles.secondaryButton,
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

          {!isProduction && (
            <Pressable
              onPress={() => handleDevLogin(MAIN_TEST_USER.email)}
              disabled={signingInAs !== null}
              style={({ pressed }) => [
                styles.secondaryButton,
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
        {!isProduction && (
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
    </LinearGradient>
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    shadowColor: '#181c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tagline: {
    marginTop: spacing.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  authCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#181c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
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
    maxWidth: 340,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  devSection: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.xs,
  },
  devUserButton: {
    width: '100%',
  },
});

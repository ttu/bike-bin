import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const { t: tDemo } = useTranslation('demo');
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { enterDemoMode } = useDemoMode();
  const [isDevExpanded, setIsDevExpanded] = useState(false);
  const [signingInAs, setSigningInAs] = useState<string | null>(null);

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
        <View style={styles.logoSection}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="bike" size={56} color={theme.colors.primary} />
          </View>
          <Text
            variant="headlineLarge"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            {t('welcome.title')}
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('welcome.tagline')}
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            mode="contained"
            onPress={signInWithApple}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.onBackground}
            textColor={theme.colors.background}
            icon="apple"
          >
            {t('welcome.continueWithApple')}
          </Button>

          <Button
            mode="outlined"
            onPress={signInWithGoogle}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="google"
          >
            {t('welcome.continueWithGoogle')}
          </Button>
        </View>

        <Button mode="text" onPress={handleBrowseWithout} style={styles.browseLink}>
          {t('welcome.browseWithout')} →
        </Button>

        <Button
          mode="contained-tonal"
          onPress={handleTryDemo}
          style={styles.demoButton}
          contentStyle={styles.buttonContent}
          icon="play-circle-outline"
        >
          {tDemo('welcome.tryDemo')}
        </Button>

        {!isProduction && (
          <View style={styles.devSection}>
            <View style={[styles.devDivider, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Development
            </Text>
            <Button
              mode="contained-tonal"
              onPress={() => handleDevLogin(MAIN_TEST_USER.email)}
              loading={signingInAs === MAIN_TEST_USER.email}
              disabled={signingInAs !== null}
              style={styles.devButton}
              contentStyle={styles.buttonContent}
              icon="bug-outline"
            >
              {t('devLogin.button')}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsDevExpanded(!isDevExpanded)}
              compact
              icon={isDevExpanded ? 'chevron-up' : 'chevron-down'}
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
    marginBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  buttonSection: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.md,
  },
  button: {
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  browseLink: {
    marginTop: spacing.lg,
  },
  demoButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  devSection: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  devDivider: {
    width: '60%',
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.xs,
  },
  devButton: {
    borderRadius: borderRadius.md,
    width: '100%',
  },
  devUserButton: {
    width: '100%',
  },
});

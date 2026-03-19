import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/features/auth';
import { spacing, borderRadius } from '@/shared/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleBrowseWithout = () => {
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
});

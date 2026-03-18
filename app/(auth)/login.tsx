import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/features/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleBrowseWithout = () => {
    router.replace('/(tabs)/inventory');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.logoSection}>
        <MaterialCommunityIcons name="bike" size={80} color={theme.colors.primary} />
        <Text variant="headlineLarge" style={styles.title}>
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
          buttonColor={theme.colors.onBackground}
          textColor={theme.colors.background}
          icon="apple"
        >
          {t('welcome.continueWithApple')}
        </Button>

        <Button mode="outlined" onPress={signInWithGoogle} style={styles.button} icon="google">
          {t('welcome.continueWithGoogle')}
        </Button>
      </View>

      <Button mode="text" onPress={handleBrowseWithout} style={styles.browseLink}>
        {t('welcome.browseWithout')} →
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonSection: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  browseLink: {
    marginTop: 24,
  },
});

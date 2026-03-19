import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { spacing } from '@/shared/theme';
import { useDemoMode } from '../hooks/useDemoMode';

/**
 * Banner shown at the top of screens when in demo mode.
 * Displays a message and a CTA to sign up.
 */
export function DemoBanner() {
  const theme = useTheme();
  const { t } = useTranslation('demo');
  const { isDemoMode, exitDemoMode } = useDemoMode();

  if (!isDemoMode) {
    return null;
  }

  const handleSignUp = () => {
    exitDemoMode();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.tertiaryContainer }]}>
      <Text
        variant="bodySmall"
        style={[styles.text, { color: theme.colors.onTertiaryContainer }]}
        numberOfLines={1}
      >
        {t('banner.message')}
      </Text>
      <Button
        mode="text"
        compact
        onPress={handleSignUp}
        textColor={theme.colors.onTertiaryContainer}
        labelStyle={styles.buttonLabel}
      >
        {t('banner.signUp')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  text: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

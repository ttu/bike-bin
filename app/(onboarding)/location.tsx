import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ProgressDots } from '@/features/onboarding/components/ProgressDots';

export default function LocationSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation('onboarding');

  const [postcode, setPostcode] = useState('');
  const [label, setLabel] = useState('');

  const handleDone = () => {
    // TODO: Save location to Supabase, geocode via Nominatim in Phase 5
    router.replace('/(tabs)/inventory');
  };

  const handleSkip = () => {
    router.replace('/(tabs)/inventory');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProgressDots total={2} current={2} />
      <Text variant="headlineMedium" style={styles.title}>
        {t('location.title')}
      </Text>

      <TextInput
        label={t('location.postcodeLabel')}
        placeholder={t('location.postcodePlaceholder')}
        value={postcode}
        onChangeText={setPostcode}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label={t('location.labelLabel')}
        placeholder={t('location.labelPlaceholder')}
        value={label}
        onChangeText={setLabel}
        mode="outlined"
        style={styles.input}
      />

      <View style={[styles.privacyCallout, { backgroundColor: theme.colors.secondaryContainer }]}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={20}
          color={theme.colors.onSecondaryContainer}
        />
        <Text
          variant="bodySmall"
          style={[styles.privacyText, { color: theme.colors.onSecondaryContainer }]}
        >
          {t('location.privacyCallout')}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Button mode="text" onPress={handleSkip}>
          {t('location.skip')}
        </Button>
        <Button mode="contained" onPress={handleDone}>
          {t('location.done')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  privacyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  privacyText: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

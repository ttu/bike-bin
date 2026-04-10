import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, ActivityIndicator, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ProgressDots } from '@/features/onboarding/components/ProgressDots';
import { useAuth } from '@/features/auth';
import { useCreateLocation, geocodePostcode } from '@/features/locations';
import type { GeocodeResult } from '@/features/locations';
import { spacing, borderRadius } from '@/shared/theme';

export default function LocationSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation('onboarding');
  const { t: tLocations } = useTranslation('locations');
  const { user } = useAuth();

  const [postcode, setPostcode] = useState('');
  const [label, setLabel] = useState('');
  const [geocoded, setGeocoded] = useState<GeocodeResult | undefined>(undefined);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | undefined>(undefined);

  const createLocation = useCreateLocation();

  const handleGeocodePostcode = useCallback(async () => {
    if (!postcode.trim()) return;

    setIsGeocoding(true);
    setGeocoded(undefined);
    setGeocodeError(undefined);

    try {
      const result = await geocodePostcode(postcode);
      setGeocoded(result);
    } catch {
      setGeocodeError(tLocations('errors.geocodeFailed'));
    } finally {
      setIsGeocoding(false);
    }
  }, [postcode, tLocations]);

  const handleDone = useCallback(async () => {
    if (!postcode.trim()) {
      // Skip if no postcode entered
      router.replace('/(tabs)/inventory');
      return;
    }

    // If not geocoded yet, do it first
    let geocodeResult = geocoded;
    if (!geocodeResult) {
      setIsGeocoding(true);
      try {
        geocodeResult = await geocodePostcode(postcode);
        setGeocoded(geocodeResult);
      } catch {
        setGeocodeError(tLocations('errors.geocodeFailed'));
        setIsGeocoding(false);
        return;
      }
      setIsGeocoding(false);
    }

    // Save to Supabase as primary location
    if (user) {
      try {
        await createLocation.mutateAsync({
          postcode: postcode.trim(),
          label: label.trim() || 'Home',
          isPrimary: true,
        });
      } catch {
        // If save fails, still navigate forward
      }
    }

    router.replace('/(tabs)/inventory');
  }, [postcode, label, geocoded, user, createLocation, tLocations]);

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
        onChangeText={(text) => {
          setPostcode(text);
          setGeocoded(undefined);
          setGeocodeError(undefined);
        }}
        onBlur={handleGeocodePostcode}
        mode="outlined"
        style={styles.input}
        autoCapitalize="characters"
      />

      {isGeocoding && (
        <View style={styles.geocodingRow}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {tLocations('form.geocoding')}
          </Text>
        </View>
      )}

      {geocoded && (
        <View style={[styles.areaPreview, { backgroundColor: theme.colors.secondaryContainer }]}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={20}
            color={theme.colors.onSecondaryContainer}
          />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
            {tLocations('onboarding.areaPreview', { areaName: geocoded.areaName })}
          </Text>
        </View>
      )}

      {geocodeError && (
        <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
          {geocodeError}
        </Text>
      )}

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
        <Button
          mode="contained"
          onPress={handleDone}
          loading={createLocation.isPending || isGeocoding}
          disabled={createLocation.isPending || isGeocoding}
        >
          {t('location.done')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.base,
  },
  geocodingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  areaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  errorText: {
    marginBottom: spacing.md,
  },
  privacyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.base,
  },
});

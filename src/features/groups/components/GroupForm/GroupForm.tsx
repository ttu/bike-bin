import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Appbar,
  Text,
  TextInput,
  Switch,
  HelperText,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/GradientButton';
import { borderRadius, iconSize, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { geocodePostcode, type GeocodeResult } from '@/features/locations';

export interface GroupFormSubmission {
  name: string;
  description: string | undefined;
  isPublic: boolean;
  postcode: string;
  country?: string;
  areaName: string;
  latitude: number;
  longitude: number;
}

interface GroupFormProps {
  readonly title: string;
  readonly submitLabel: string;
  readonly submitTestID?: string;
  readonly initialName?: string;
  readonly initialDescription?: string;
  readonly initialIsPublic?: boolean;
  readonly initialPostcode?: string;
  readonly initialCountry?: string;
  readonly initialAreaName?: string;
  readonly initialLatitude?: number;
  readonly initialLongitude?: number;
  readonly isSubmitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (data: GroupFormSubmission) => void;
}

/**
 * Shared form used by the group create and edit screens. Captures name,
 * description, public flag and a postcode-derived location (geocoded via the
 * Edge Function). Location is required so group-owned items have a pickup
 * point for nearby search.
 */
export function GroupForm({
  title,
  submitLabel,
  submitTestID,
  initialName = '',
  initialDescription = '',
  initialIsPublic = false,
  initialPostcode = '',
  initialCountry,
  initialAreaName,
  initialLatitude,
  initialLongitude,
  isSubmitting,
  onCancel,
  onSubmit,
}: GroupFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('groups');

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [geocoded, setGeocoded] = useState<GeocodeResult | undefined>(
    initialAreaName !== undefined && initialLatitude !== undefined && initialLongitude !== undefined
      ? { areaName: initialAreaName, lat: initialLatitude, lng: initialLongitude }
      : undefined,
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    postcode?: string;
    geocode?: string;
  }>({});

  const themeStyles = {
    container: { backgroundColor: theme.colors.background },
    appbar: { backgroundColor: theme.colors.background },
    softInput: {
      backgroundColor: theme.customColors.surfaceContainerHighest,
      borderRadius: borderRadius.md,
    },
    description: { color: theme.colors.onSurfaceVariant },
    areaPreview: { backgroundColor: theme.colors.secondaryContainer },
    onSecondaryContainer: { color: theme.colors.onSecondaryContainer },
  };
  const underlineColor = colorWithAlpha(theme.colors.outlineVariant, 0.15);
  const activeUnderlineColor = theme.colors.primary;

  const handleGeocodePostcode = useCallback(async () => {
    const trimmed = postcode.trim();
    if (!trimmed) return;

    setIsGeocoding(true);
    setGeocoded(undefined);
    setErrors((prev) => ({ ...prev, geocode: undefined }));

    try {
      const result = await geocodePostcode(trimmed, initialCountry);
      setGeocoded(result);
    } catch {
      setErrors((prev) => ({ ...prev, geocode: t('form.geocodeFailed') }));
    } finally {
      setIsGeocoding(false);
    }
  }, [postcode, initialCountry, t]);

  const handleSubmit = useCallback(() => {
    const newErrors: { name?: string; postcode?: string; geocode?: string } = {};
    if (!name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }
    if (!postcode.trim()) {
      newErrors.postcode = t('validation.postcodeRequired');
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!geocoded) {
      void handleGeocodePostcode();
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
      postcode: postcode.trim(),
      country: initialCountry,
      areaName: geocoded.areaName,
      latitude: geocoded.lat,
      longitude: geocoded.lng,
    });
  }, [
    name,
    description,
    isPublic,
    postcode,
    geocoded,
    initialCountry,
    handleGeocodePostcode,
    onSubmit,
    t,
  ]);

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Appbar.Header dark={theme.dark} style={themeStyles.appbar}>
        <Appbar.BackAction onPress={onCancel} />
        <Appbar.Content title={title} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.formContent}>
        <Text variant="labelLarge" style={styles.label}>
          {t('create.nameLabel')}
        </Text>
        <TextInput
          mode="flat"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (errors.name && value.trim()) {
              setErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          placeholder={t('create.namePlaceholder')}
          error={!!errors.name}
          style={themeStyles.softInput}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        {errors.name ? (
          <HelperText type="error" visible>
            {errors.name}
          </HelperText>
        ) : null}

        <Text variant="labelLarge" style={styles.label}>
          {t('create.descriptionLabel')}
        </Text>
        <TextInput
          mode="flat"
          value={description}
          onChangeText={setDescription}
          placeholder={t('create.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
          style={themeStyles.softInput}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />

        <Text variant="labelLarge" style={styles.label}>
          {t('create.postcodeLabel')}
        </Text>
        <Text variant="bodySmall" style={[styles.fieldHelper, themeStyles.description]}>
          {t('create.postcodeHelper')}
        </Text>
        <View style={styles.postcodeRow}>
          <TextInput
            mode="flat"
            value={postcode}
            onChangeText={(value) => {
              setPostcode(value);
              setGeocoded(undefined);
              if (errors.postcode && value.trim()) {
                setErrors((prev) => ({ ...prev, postcode: undefined }));
              }
            }}
            placeholder={t('create.postcodePlaceholder')}
            error={!!errors.postcode}
            style={[themeStyles.softInput, styles.postcodeInput]}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
            onBlur={handleGeocodePostcode}
            autoCapitalize="characters"
            testID="group-form-postcode"
          />
          {isGeocoding ? <ActivityIndicator size="small" style={styles.geocodingSpinner} /> : null}
        </View>
        {errors.postcode ? (
          <HelperText type="error" visible>
            {errors.postcode}
          </HelperText>
        ) : null}
        {geocoded ? (
          <View style={[styles.areaPreview, themeStyles.areaPreview]}>
            <MaterialCommunityIcons
              name="map-marker-check"
              size={iconSize.sm}
              color={theme.colors.onSecondaryContainer}
            />
            <Text variant="bodyMedium" style={themeStyles.onSecondaryContainer}>
              {geocoded.areaName}
            </Text>
          </View>
        ) : null}
        {errors.geocode ? (
          <HelperText type="error" visible>
            {errors.geocode}
          </HelperText>
        ) : null}

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text variant="labelLarge">{t('create.publicLabel')}</Text>
            <Text variant="bodySmall" style={themeStyles.description}>
              {isPublic ? t('create.publicDescription') : t('create.privateDescription')}
            </Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>

        <GradientButton
          testID={submitTestID}
          onPress={handleSubmit}
          loading={isSubmitting || isGeocoding}
          disabled={isSubmitting || isGeocoding}
          style={styles.submitButton}
        >
          {submitLabel}
        </GradientButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  label: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  fieldHelper: {
    marginBottom: spacing.xs,
  },
  postcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postcodeInput: {
    flex: 1,
  },
  geocodingSpinner: {
    marginLeft: spacing.sm,
  },
  areaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    flex: 1,
    gap: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

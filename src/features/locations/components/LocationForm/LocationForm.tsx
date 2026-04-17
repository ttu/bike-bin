import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { geocodePostcode } from '../../utils/geocoding';
import type { GeocodeResult } from '../../utils/geocoding';
import { collectFormErrorMessages } from '@/shared/utils/formValidationFeedback';

export interface LocationFormData {
  postcode: string;
  label: string;
  isPrimary: boolean;
}

interface LocationFormProps {
  initialData?: Partial<LocationFormData>;
  onSave: (data: LocationFormData & { geocoded: GeocodeResult }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  showPrimaryToggle?: boolean;
  onValidationError?: (messages: string[]) => void;
}

export function LocationForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting,
  showPrimaryToggle = true,
  onValidationError,
}: LocationFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('locations');

  const softInputStyles = useMemo(
    () =>
      StyleSheet.create({
        softInput: {
          backgroundColor: theme.customColors.surfaceContainerHighest,
          borderRadius: borderRadius.md,
        },
      }),
    [theme],
  );
  const underlineColor = colorWithAlpha(theme.colors.outlineVariant, 0.15);
  const activeUnderlineColor = theme.colors.primary;

  const [postcode, setPostcode] = useState(initialData?.postcode ?? '');
  const [label, setLabel] = useState(initialData?.label ?? '');
  const [isPrimary, setIsPrimary] = useState(initialData?.isPrimary ?? false);
  const [geocoded, setGeocoded] = useState<GeocodeResult | undefined>(undefined);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errors, setErrors] = useState<{
    postcode?: string;
    label?: string;
    geocode?: string;
  }>({});

  const handleGeocodePostcode = useCallback(async () => {
    if (!postcode.trim()) return;

    setIsGeocoding(true);
    setGeocoded(undefined);
    setErrors((prev) => ({ ...prev, geocode: undefined }));

    try {
      const result = await geocodePostcode(postcode);
      setGeocoded(result);
    } catch {
      setErrors((prev) => ({ ...prev, geocode: t('errors.geocodeFailed') }));
    } finally {
      setIsGeocoding(false);
    }
  }, [postcode, t]);

  const handleSubmit = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!postcode.trim()) {
      newErrors.postcode = t('errors.postcodeRequired');
    }
    if (!label.trim()) {
      newErrors.label = t('errors.labelRequired');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const messages = collectFormErrorMessages(newErrors);
      if (messages.length > 0) {
        onValidationError?.(messages);
      }
      return;
    }

    if (!geocoded) {
      // Trigger geocoding first
      handleGeocodePostcode().then(() => {
        // Re-validate after geocoding
      });
      return;
    }

    onSave({ postcode: postcode.trim(), label: label.trim(), isPrimary, geocoded });
  }, [postcode, label, isPrimary, geocoded, onSave, handleGeocodePostcode, onValidationError, t]);

  return (
    <View style={styles.container}>
      {/* Postcode */}
      <Text variant="labelLarge" style={styles.fieldLabel}>
        {t('form.postcodeLabel')}
      </Text>
      <View style={styles.postcodeRow}>
        <TextInput
          mode="flat"
          value={postcode}
          onChangeText={(text) => {
            setPostcode(text);
            setGeocoded(undefined);
          }}
          placeholder={t('form.postcodePlaceholder')}
          error={!!errors.postcode}
          style={[softInputStyles.softInput, styles.postcodeInput]}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
          onBlur={handleGeocodePostcode}
          autoCapitalize="characters"
        />
        {isGeocoding && <ActivityIndicator size="small" style={styles.geocodingSpinner} />}
      </View>
      {errors.postcode && (
        <HelperText type="error" visible>
          {errors.postcode}
        </HelperText>
      )}

      {/* Area Preview */}
      {geocoded && (
        <View style={[styles.areaPreview, { backgroundColor: theme.colors.secondaryContainer }]}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={iconSize.sm}
            color={theme.colors.onSecondaryContainer}
          />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
            {t('form.areaPreview', { areaName: geocoded.areaName })}
          </Text>
        </View>
      )}

      {errors.geocode && (
        <HelperText type="error" visible>
          {errors.geocode}
        </HelperText>
      )}

      {/* Label */}
      <Text variant="labelLarge" style={styles.fieldLabel}>
        {t('form.labelLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={label}
        onChangeText={setLabel}
        placeholder={t('form.labelPlaceholder')}
        error={!!errors.label}
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.label && (
        <HelperText type="error" visible>
          {errors.label}
        </HelperText>
      )}

      {/* Primary Toggle */}
      {showPrimaryToggle && (
        <View style={styles.primaryRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t('form.primaryToggle')}
          </Text>
          <Switch value={isPrimary} onValueChange={setIsPrimary} color={theme.colors.primary} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.buttonRow}>
        <Button mode="text" onPress={onCancel} disabled={isSubmitting}>
          {t('form.cancel')}
        </Button>
        <GradientButton
          onPress={handleSubmit}
          loading={isSubmitting || isGeocoding}
          disabled={isSubmitting || isGeocoding}
        >
          {t('form.save')}
        </GradientButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
  },
  fieldLabel: {
    marginTop: spacing.base,
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
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});

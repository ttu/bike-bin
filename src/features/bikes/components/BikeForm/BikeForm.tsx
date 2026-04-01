import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, Button, HelperText, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { BrandAutocompleteInput } from '@/shared/components/BrandAutocompleteInput';
import { useBrandAutocomplete } from '@/shared/hooks/useBrandAutocomplete';
import { useTranslation } from 'react-i18next';
import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeId, BikePhoto } from '@/shared/types';
import { PhotoPicker } from '@/features/inventory/components/PhotoPicker/PhotoPicker';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { BikeFormData } from '../../types';
import { DEFAULT_BIKE_BRANDS } from '../../constants';

const BIKE_TYPES = [
  BikeType.Road,
  BikeType.Gravel,
  BikeType.MTB,
  BikeType.City,
  BikeType.Touring,
  BikeType.Other,
];

const ITEM_CONDITIONS = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];

interface BikeFormProps {
  initialData?: BikeFormData;
  bikeId?: BikeId;
  photos?: BikePhoto[];
  onAddPhoto?: () => void;
  onRemovePhoto?: (photoId: string) => void;
  isUploadingPhoto?: boolean;
  onSave: (data: BikeFormData) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}

interface BikeFormErrors {
  name?: string;
  type?: string;
  distanceKm?: string;
  usageHours?: string;
}

function optionalNumberFromInput(raw: string): { value: number | undefined; invalid: boolean } {
  const t = raw.trim();
  if (!t) return { value: undefined, invalid: false };
  const n = parseFloat(t.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return { value: undefined, invalid: true };
  return { value: n, invalid: false };
}

export function BikeForm({
  initialData,
  photos,
  onAddPhoto,
  onRemovePhoto,
  isUploadingPhoto,
  onSave,
  onDelete,
  isSubmitting,
}: BikeFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

  const softInputStyle = {
    backgroundColor: theme.customColors.surfaceContainerHighest,
    borderRadius: 12,
  };
  const underlineColor = theme.colors.outlineVariant + '26';
  const activeUnderlineColor = theme.colors.primary;

  const [name, setName] = useState(initialData?.name ?? '');
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const {
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
  } = useBrandAutocomplete({ brand, setBrand, brands: DEFAULT_BIKE_BRANDS });
  const [model, setModel] = useState(initialData?.model ?? '');
  const [bikeType, setBikeType] = useState<BikeType | undefined>(initialData?.type);
  const [year, setYear] = useState(initialData?.year?.toString() ?? '');
  const [distanceKmStr, setDistanceKmStr] = useState(
    initialData?.distanceKm != null ? String(initialData.distanceKm) : '',
  );
  const [usageHoursStr, setUsageHoursStr] = useState(
    initialData?.usageHours != null ? String(initialData.usageHours) : '',
  );
  const [bikeCondition, setBikeCondition] = useState<ItemCondition>(
    initialData?.condition ?? ItemCondition.Good,
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [errors, setErrors] = useState<BikeFormErrors>({});

  const handleSubmit = useCallback(() => {
    const validationErrors: BikeFormErrors = {};
    if (!name.trim()) {
      validationErrors.name = t('form.nameRequired');
    }
    if (!bikeType) {
      validationErrors.type = t('form.typeRequired');
    }

    const distanceParsed = optionalNumberFromInput(distanceKmStr);
    if (distanceParsed.invalid) {
      validationErrors.distanceKm = t('form.distanceInvalid');
    }

    const hoursParsed = optionalNumberFromInput(usageHoursStr);
    if (hoursParsed.invalid) {
      validationErrors.usageHours = t('form.hoursInvalid');
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      type: bikeType,
      year: year.trim() ? parseInt(year.trim(), 10) : undefined,
      distanceKm: distanceParsed.value,
      usageHours: hoursParsed.value,
      condition: bikeCondition,
      notes: notes.trim() || undefined,
    });
  }, [
    name,
    brand,
    model,
    bikeType,
    year,
    distanceKmStr,
    usageHoursStr,
    bikeCondition,
    notes,
    t,
    onSave,
  ]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={name}
        onChangeText={setName}
        placeholder={t('form.namePlaceholder')}
        error={!!errors.name}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.name && (
        <HelperText type="error" visible>
          {errors.name}
        </HelperText>
      )}

      {/* Type */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.typeLabel')}
      </Text>
      <View style={styles.chipRow}>
        {BIKE_TYPES.map((type) => (
          <Chip
            key={type}
            selected={bikeType === type}
            onPress={() => setBikeType(type)}
            showSelectedCheck={false}
            textStyle={bikeType === type ? { color: theme.colors.onPrimary } : undefined}
            style={[
              styles.chip,
              {
                backgroundColor:
                  bikeType === type ? theme.colors.primary : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t(`bikeType.${type}`)}
          </Chip>
        ))}
      </View>
      {errors.type && (
        <HelperText type="error" visible>
          {errors.type}
        </HelperText>
      )}

      <BrandAutocompleteInput
        label={t('form.brandLabel')}
        labelStyle={styles.label}
        placeholder={t('form.brandPlaceholder')}
        value={brand}
        filteredBrands={filteredBrands}
        menuVisible={brandMenuVisible}
        onChangeText={handleBrandInputChange}
        onSelectBrand={handleBrandSelect}
        onFocus={handleBrandFocus}
        onBlur={handleBrandBlur}
        softInputStyle={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      {/* Model */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.modelLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={model}
        onChangeText={setModel}
        placeholder={t('form.modelPlaceholder')}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      {/* Year */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.yearLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={year}
        onChangeText={setYear}
        placeholder={t('form.yearPlaceholder')}
        keyboardType="numeric"
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      {/* Distance (km) */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.distanceLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={distanceKmStr}
        onChangeText={setDistanceKmStr}
        placeholder={t('form.distancePlaceholder')}
        keyboardType="decimal-pad"
        error={!!errors.distanceKm}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.distanceKm && (
        <HelperText type="error" visible>
          {errors.distanceKm}
        </HelperText>
      )}

      {/* Usage hours */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.hoursLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={usageHoursStr}
        onChangeText={setUsageHoursStr}
        placeholder={t('form.hoursPlaceholder')}
        keyboardType="decimal-pad"
        error={!!errors.usageHours}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.usageHours && (
        <HelperText type="error" visible>
          {errors.usageHours}
        </HelperText>
      )}

      {/* Condition */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.conditionLabel')}
      </Text>
      <View style={styles.chipRow}>
        {ITEM_CONDITIONS.map((c) => (
          <Chip
            key={c}
            selected={bikeCondition === c}
            onPress={() => setBikeCondition(c)}
            showSelectedCheck={false}
            textStyle={bikeCondition === c ? { color: theme.colors.onPrimary } : undefined}
            style={[
              styles.chip,
              {
                backgroundColor:
                  bikeCondition === c ? theme.colors.primary : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t(`condition.${c}`)}
          </Chip>
        ))}
      </View>

      {/* Notes */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.notesLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={notes}
        onChangeText={setNotes}
        placeholder={t('form.notesPlaceholder')}
        multiline
        numberOfLines={4}
        style={[softInputStyle, styles.notesInput]}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      {/* Photos (edit mode only) */}
      {photos && onAddPhoto && (
        <View style={styles.photoSection}>
          <PhotoPicker
            photos={photos}
            onAdd={onAddPhoto}
            onRemove={onRemovePhoto}
            isUploading={isUploadingPhoto ?? false}
          />
        </View>
      )}

      {/* Save */}
      <GradientButton
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.saveButton}
      >
        {t('form.save')}
      </GradientButton>

      {/* Delete (edit mode) */}
      {onDelete && (
        <Button
          mode="outlined"
          onPress={onDelete}
          textColor={theme.colors.error}
          style={styles.deleteButton}
        >
          {t('form.delete')}
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  label: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
  photoSection: {
    marginTop: spacing.base,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.md,
    borderColor: 'transparent',
  },
});

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Banner, Text, TextInput, Chip, Button, HelperText, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GradientButton } from '@/shared/components/GradientButton';
import { BrandAutocompleteInput } from '@/shared/components/BrandAutocompleteInput';
import { useBrandAutocomplete } from '@/shared/hooks/useBrandAutocomplete';
import { useTranslation } from 'react-i18next';
import { BikeType, ItemCondition } from '@/shared/types';
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

const CONDITION_ICONS: Record<string, string> = {
  new: 'shield-check',
  good: 'emoticon-happy-outline',
  worn: 'history',
  broken: 'close-circle-outline',
};

interface BikeFormProps {
  initialData?: BikeFormData;
  headerComponent?: ReactNode;
  photoSection?: ReactNode;
  onSave: (data: BikeFormData) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
  submitBlockedMessage?: string;
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
  headerComponent,
  photoSection,
  onSave,
  onDelete,
  isSubmitting,
  isEditMode = false,
  submitBlockedMessage,
}: BikeFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

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
    cancelBlurTimeout: cancelBrandBlurTimeout,
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
      {headerComponent}
      {photoSection}

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={name}
        onChangeText={setName}
        placeholder={t('form.namePlaceholder')}
        error={!!errors.name}
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.name && (
        <HelperText type="error" visible>
          {errors.name}
        </HelperText>
      )}

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.typeLabel')}
      </Text>
      <View style={styles.chipRow}>
        {BIKE_TYPES.map((type) => {
          const active = bikeType === type;
          return (
            <Chip
              key={type}
              selected={active}
              onPress={() => setBikeType(type)}
              showSelectedCheck={false}
              textStyle={active ? { color: theme.colors.onPrimary } : undefined}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.secondaryContainer,
                },
              ]}
            >
              {t(`bikeType.${type}`)}
            </Chip>
          );
        })}
      </View>
      {errors.type && (
        <HelperText type="error" visible>
          {errors.type}
        </HelperText>
      )}

      <View style={styles.conditionHeader}>
        <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
          {t('form.conditionLabel')}
        </Text>
        {bikeCondition && (
          <Text
            variant="labelMedium"
            style={[styles.conditionValue, { color: theme.colors.primary }]}
          >
            {t(`condition.${bikeCondition}`)}
          </Text>
        )}
      </View>
      <View style={styles.conditionRow}>
        {ITEM_CONDITIONS.map((cond) => {
          const active = bikeCondition === cond;
          return (
            <Pressable
              key={cond}
              onPress={() => setBikeCondition(cond)}
              style={[
                styles.conditionButton,
                {
                  backgroundColor: active
                    ? theme.colors.primary + '14'
                    : theme.customColors.surfaceContainerLow,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  borderWidth: active ? 2 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={(CONDITION_ICONS[cond] ?? 'shield-check') as never}
                size={28}
                color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: active ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: spacing.xs,
                }}
              >
                {t(`condition.${cond}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <BrandAutocompleteInput
        label={t('form.brandLabel')}
        labelStyle={[styles.label, styles.sectionLabel]}
        placeholder={t('form.brandPlaceholder')}
        value={brand}
        filteredBrands={filteredBrands}
        menuVisible={brandMenuVisible}
        onChangeText={handleBrandInputChange}
        onSelectBrand={handleBrandSelect}
        onFocus={handleBrandFocus}
        onBlur={handleBrandBlur}
        onSuggestionPressIn={cancelBrandBlurTimeout}
        softInputStyle={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.modelLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={model}
        onChangeText={setModel}
        placeholder={t('form.modelPlaceholder')}
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.yearLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={year}
        onChangeText={setYear}
        placeholder={t('form.yearPlaceholder')}
        keyboardType="numeric"
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.distanceLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={distanceKmStr}
        onChangeText={setDistanceKmStr}
        placeholder={t('form.distancePlaceholder')}
        keyboardType="decimal-pad"
        error={!!errors.distanceKm}
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.distanceKm && (
        <HelperText type="error" visible>
          {errors.distanceKm}
        </HelperText>
      )}

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.hoursLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={usageHoursStr}
        onChangeText={setUsageHoursStr}
        placeholder={t('form.hoursPlaceholder')}
        keyboardType="decimal-pad"
        error={!!errors.usageHours}
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.usageHours && (
        <HelperText type="error" visible>
          {errors.usageHours}
        </HelperText>
      )}

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.notesLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={notes}
        onChangeText={setNotes}
        placeholder={t('form.notesPlaceholder')}
        multiline
        numberOfLines={4}
        style={[softInputStyles.softInput, styles.notesInput]}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      {submitBlockedMessage ? (
        <Banner visible icon="information" style={styles.limitBanner}>
          <Text variant="bodyMedium">{submitBlockedMessage}</Text>
        </Banner>
      ) : null}

      <GradientButton
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting || Boolean(submitBlockedMessage)}
        icon={isEditMode ? 'check-circle-outline' : undefined}
        style={styles.saveButton}
      >
        {isEditMode ? t('form.updateBike') : t('form.save')}
      </GradientButton>

      {onDelete && (
        <Button
          mode="text"
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionValue: {
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conditionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
  limitBanner: {
    marginTop: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
});

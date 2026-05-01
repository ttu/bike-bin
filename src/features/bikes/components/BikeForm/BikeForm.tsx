import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Banner, Text, TextInput, Chip, Button, HelperText, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GradientButton } from '@/shared/components/GradientButton';
import { BrandAutocompleteInput } from '@/shared/components/BrandAutocompleteInput';
import { useBrandAutocomplete } from '@/shared/hooks/useBrandAutocomplete';
import { useTranslation } from 'react-i18next';
import { BikeType, ItemCondition } from '@/shared/types';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { BikeFormData } from '../../types';
import { DEFAULT_BIKE_BRANDS } from '../../constants';
import { resolveFormName } from '@/shared/utils';
import { CONDITION_ICON, CONDITION_ICON_FALLBACK } from '@/shared/constants/conditionIcons';
import { buildBikeFormDataFromFields } from '../../utils/buildBikeFormDataFromFields';
import { areBikeFormDataEqual } from '../../utils/bikeFormDataEquality';
import { validateBikeForm, type BikeFormErrors } from '../../utils/bikeFormValidation';
import { collectFormErrorMessages } from '@/shared/utils/formValidationFeedback';

const BIKE_TYPES = [
  BikeType.Road,
  BikeType.Gravel,
  BikeType.MTB,
  BikeType.XC,
  BikeType.Enduro,
  BikeType.Downhill,
  BikeType.Cyclo,
  BikeType.City,
  BikeType.Touring,
  BikeType.BMX,
  BikeType.Fatbike,
  BikeType.Other,
];

const ITEM_CONDITIONS = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];

interface BikeFormProps {
  readonly initialData?: BikeFormData;
  readonly headerComponent?: ReactNode;
  readonly photoSection?: ReactNode;
  readonly onSave: (data: BikeFormData) => void;
  readonly onDelete?: () => void;
  readonly isSubmitting: boolean;
  readonly isEditMode?: boolean;
  readonly submitBlockedMessage?: string;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly onValidationError?: (messages: string[]) => void;
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
  onDirtyChange,
  onValidationError,
}: BikeFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

  const softInputStyles = StyleSheet.create({
    softInput: {
      backgroundColor: theme.customColors.surfaceContainerHighest,
      borderRadius: borderRadius.md,
    },
  });
  const underlineColor = colorWithAlpha(theme.colors.outlineVariant, 0.15);
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
    initialData?.distanceKm == null ? '' : String(initialData.distanceKm),
  );
  const [usageHoursStr, setUsageHoursStr] = useState(
    initialData?.usageHours == null ? '' : String(initialData.usageHours),
  );
  const [bikeCondition, setBikeCondition] = useState<ItemCondition>(
    initialData?.condition ?? ItemCondition.New,
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [errors, setErrors] = useState<BikeFormErrors>({});

  const nameFieldValue = useMemo(
    () => (name.trim() === '' ? resolveFormName('', brand, model) : name),
    [name, brand, model],
  );

  const draftData = useMemo(
    () =>
      buildBikeFormDataFromFields({
        name,
        brand,
        model,
        bikeType,
        year,
        distanceKmStr,
        usageHoursStr,
        bikeCondition,
        notes,
      }),
    [name, brand, model, bikeType, year, distanceKmStr, usageHoursStr, bikeCondition, notes],
  );

  const isDirty = useMemo(() => {
    if (!initialData) return true;
    return !areBikeFormDataEqual(initialData, draftData);
  }, [initialData, draftData]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const nameIsEmpty = name.trim().length === 0;
  const brandPlaceholder = nameIsEmpty
    ? t('form.brandPlaceholderWhenNameEmpty')
    : t('form.brandPlaceholder');
  const modelPlaceholder = nameIsEmpty
    ? t('form.modelPlaceholderWhenNameEmpty')
    : t('form.modelPlaceholder');

  const handleSubmit = useCallback(() => {
    const validationErrors = validateBikeForm(
      { name, brand, model, bikeType, distanceKmStr, usageHoursStr },
      t,
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const messages = collectFormErrorMessages(validationErrors);
      if (messages.length > 0) {
        onValidationError?.(messages);
      }
      return;
    }

    onSave(draftData);
  }, [
    name,
    brand,
    model,
    bikeType,
    distanceKmStr,
    usageHoursStr,
    t,
    onSave,
    onValidationError,
    draftData,
  ]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {photoSection}
      {headerComponent}

      <BrandAutocompleteInput
        label={t('form.brandLabel')}
        labelStyle={[styles.label, styles.sectionLabel]}
        placeholder={brandPlaceholder}
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
        placeholder={modelPlaceholder}
        style={softInputStyles.softInput}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        testID="bike-form-name-input"
        mode="flat"
        value={nameFieldValue}
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
                    ? colorWithAlpha(theme.colors.primary, 0.08)
                    : theme.customColors.surfaceContainerLow,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  borderWidth: active ? 2 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={(CONDITION_ICON[cond] ?? CONDITION_ICON_FALLBACK) as never}
                size={28}
                color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: active ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  marginTop: spacing.xs,
                }}
              >
                {t(`condition.${cond}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        disabled={isSubmitting || Boolean(submitBlockedMessage) || (isEditMode && !isDirty)}
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
  sectionLabel: {},
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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

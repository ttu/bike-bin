import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, Button, HelperText, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import { BikeType } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { BikeFormData } from '../../types';

const BIKE_TYPES = [
  BikeType.Road,
  BikeType.Gravel,
  BikeType.MTB,
  BikeType.City,
  BikeType.Touring,
  BikeType.Other,
];

interface BikeFormProps {
  initialData?: BikeFormData;
  onSave: (data: BikeFormData) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}

interface BikeFormErrors {
  name?: string;
  type?: string;
}

export function BikeForm({ initialData, onSave, onDelete, isSubmitting }: BikeFormProps) {
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
  const [model, setModel] = useState(initialData?.model ?? '');
  const [bikeType, setBikeType] = useState<BikeType | undefined>(initialData?.type);
  const [year, setYear] = useState(initialData?.year?.toString() ?? '');
  const [errors, setErrors] = useState<BikeFormErrors>({});

  const handleSubmit = useCallback(() => {
    const validationErrors: BikeFormErrors = {};
    if (!name.trim()) {
      validationErrors.name = t('form.nameRequired');
    }
    if (!bikeType) {
      validationErrors.type = t('form.typeRequired');
    }
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave({
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        type: bikeType,
        year: year ? parseInt(year, 10) : undefined,
      });
    }
  }, [name, brand, model, bikeType, year, t, onSave]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
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
            selectedColor={theme.colors.onPrimary}
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

      {/* Brand */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.brandLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={brand}
        onChangeText={setBrand}
        placeholder={t('form.brandPlaceholder')}
        style={softInputStyle}
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
  saveButton: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.md,
    borderColor: 'transparent',
  },
});

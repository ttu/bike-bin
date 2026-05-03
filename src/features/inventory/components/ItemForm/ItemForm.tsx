import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { Banner, Text, useTheme } from 'react-native-paper';
import { borderRadius, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { ItemCategory } from '@/shared/types';

import { useItemFormState } from './useItemFormState';
import type { ItemFormProps, InputStyling } from './types';
import { styles } from './styles';
import {
  NameSection,
  QuantitySection,
  CategorySection,
  ConditionSection,
  RemainingFractionSection,
  BrandModelSection,
  AvailabilitySection,
  VisibilitySection,
  OptionalSection,
  ActionsSection,
} from './sections';

export function ItemForm({
  initialData,
  initialCategory,
  onSave,
  onDelete,
  isSubmitting,
  isEditMode = false,
  headerComponent,
  photoSection,
  submitBlockedMessage,
  onDirtyChange,
  onValidationError,
}: Readonly<ItemFormProps>) {
  const theme = useTheme<AppTheme>();
  const state = useItemFormState({ initialData, initialCategory, onSave, onValidationError });

  useEffect(() => {
    onDirtyChange?.(state.isDirty);
  }, [onDirtyChange, state.isDirty]);

  const hasSubmitBlock = Boolean(submitBlockedMessage && submitBlockedMessage.length > 0);

  const inputStyling: InputStyling = {
    softInputStyle: {
      backgroundColor: theme.customColors.surfaceContainerHighest,
      borderRadius: borderRadius.md,
    },
    underlineColor: colorWithAlpha(theme.colors.outlineVariant, 0.15),
    activeUnderlineColor: theme.colors.primary,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {headerComponent}
      {photoSection}

      <BrandModelSection state={state} inputStyling={inputStyling} />
      <NameSection state={state} inputStyling={inputStyling} />
      <QuantitySection state={state} inputStyling={inputStyling} />
      <CategorySection state={state} />

      {state.category !== ItemCategory.Consumable && <ConditionSection state={state} />}
      {state.category === ItemCategory.Consumable && (
        <RemainingFractionSection state={state} inputStyling={inputStyling} />
      )}

      <AvailabilitySection state={state} inputStyling={inputStyling} />
      <VisibilitySection state={state} />
      <OptionalSection state={state} inputStyling={inputStyling} />

      {hasSubmitBlock ? (
        <Banner visible icon="information" style={styles.limitBanner}>
          <Text variant="bodyMedium">{submitBlockedMessage}</Text>
        </Banner>
      ) : null}

      <ActionsSection
        state={state}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        onDelete={onDelete}
        saveDisabled={hasSubmitBlock || (isEditMode && !state.isDirty)}
      />
    </ScrollView>
  );
}

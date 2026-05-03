import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { Banner, Text, useTheme } from 'react-native-paper';
import { borderRadius, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';

import { useBikeFormState } from './useBikeFormState';
import type { BikeFormProps, InputStyling } from './types';
import { styles } from './styles';
import {
  BrandSection,
  ModelSection,
  NameSection,
  TypeSection,
  ConditionSection,
  YearSection,
  DistanceSection,
  HoursSection,
  NotesSection,
  ActionsSection,
} from './sections';

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
  const state = useBikeFormState({ initialData, onSave, onValidationError });

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
      {photoSection}
      {headerComponent}

      <BrandSection state={state} inputStyling={inputStyling} />
      <ModelSection state={state} inputStyling={inputStyling} />
      <NameSection state={state} inputStyling={inputStyling} />
      <TypeSection state={state} />
      <ConditionSection state={state} />
      <YearSection state={state} inputStyling={inputStyling} />
      <DistanceSection state={state} inputStyling={inputStyling} />
      <HoursSection state={state} inputStyling={inputStyling} />
      <NotesSection state={state} inputStyling={inputStyling} />

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

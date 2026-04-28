import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, TextInput, Switch, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/GradientButton';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';

export interface GroupFormSubmission {
  name: string;
  description: string | undefined;
  isPublic: boolean;
}

interface GroupFormProps {
  readonly title: string;
  readonly submitLabel: string;
  readonly submitTestID?: string;
  readonly initialName?: string;
  readonly initialDescription?: string;
  readonly initialIsPublic?: boolean;
  readonly isSubmitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (data: GroupFormSubmission) => void;
}

/**
 * Shared form used by the group create and edit screens. The two screens used
 * to be near-duplicates with divergent TextInput modes; this component is the
 * single source of truth so adding a new field is a one-place change.
 */
export function GroupForm({
  title,
  submitLabel,
  submitTestID,
  initialName = '',
  initialDescription = '',
  initialIsPublic = false,
  isSubmitting,
  onCancel,
  onSubmit,
}: GroupFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('groups');

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [nameError, setNameError] = useState('');

  const themeStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      appbar: { backgroundColor: theme.colors.background },
      softInput: {
        backgroundColor: theme.customColors.surfaceContainerHighest,
        borderRadius: borderRadius.md,
      },
      description: { color: theme.colors.onSurfaceVariant },
    }),
    [
      theme.colors.background,
      theme.colors.onSurfaceVariant,
      theme.customColors.surfaceContainerHighest,
    ],
  );
  const underlineColor = colorWithAlpha(theme.colors.outlineVariant, 0.15);
  const activeUnderlineColor = theme.colors.primary;

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setNameError(t('validation.nameRequired'));
      return;
    }
    setNameError('');
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
    });
  }, [name, description, isPublic, onSubmit, t]);

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
            if (nameError && value.trim()) {
              setNameError('');
            }
          }}
          placeholder={t('create.namePlaceholder')}
          error={!!nameError}
          style={themeStyles.softInput}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        {nameError ? (
          <HelperText type="error" visible>
            {nameError}
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
          loading={isSubmitting}
          disabled={isSubmitting}
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

import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, TextInput, Switch, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/GradientButton';
import { spacing, borderRadius } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { AppTheme } from '@/shared/theme';

type GroupEditFormProps = {
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
  onCancel: () => void;
  onSubmit: (data: { name: string; description: string | undefined; isPublic: boolean }) => void;
  isSubmitting: boolean;
};

export function GroupEditForm({
  initialName,
  initialDescription,
  initialIsPublic,
  onCancel,
  onSubmit,
  isSubmitting,
}: GroupEditFormProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('groups');

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

  const [editName, setEditName] = useState(initialName);
  const [editDescription, setEditDescription] = useState(initialDescription);
  const [editIsPublic, setEditIsPublic] = useState(initialIsPublic);
  const [editNameError, setEditNameError] = useState('');

  const handleSave = useCallback(() => {
    if (!editName.trim()) {
      setEditNameError(t('validation.nameRequired'));
      return;
    }
    setEditNameError('');
    onSubmit({
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      isPublic: editIsPublic,
    });
  }, [editName, editDescription, editIsPublic, onSubmit, t]);

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Appbar.Header dark={theme.dark} style={themeStyles.appbar}>
        <Appbar.BackAction onPress={onCancel} />
        <Appbar.Content title={t('edit.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.formContent}>
        <Text variant="labelLarge" style={styles.label}>
          {t('create.nameLabel')}
        </Text>
        <TextInput
          mode="flat"
          value={editName}
          onChangeText={setEditName}
          placeholder={t('create.namePlaceholder')}
          error={!!editNameError}
          style={themeStyles.softInput}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        {editNameError && (
          <HelperText type="error" visible>
            {editNameError}
          </HelperText>
        )}

        <Text variant="labelLarge" style={styles.label}>
          {t('create.descriptionLabel')}
        </Text>
        <TextInput
          mode="flat"
          value={editDescription}
          onChangeText={setEditDescription}
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
              {editIsPublic ? t('create.publicDescription') : t('create.privateDescription')}
            </Text>
          </View>
          <Switch value={editIsPublic} onValueChange={setEditIsPublic} />
        </View>

        <GradientButton
          onPress={handleSave}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
        >
          {t('edit.save')}
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

import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, TextInput, Button, Switch, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/shared/theme';

type GroupCreateFormProps = {
  onBack: () => void;
  onSubmit: (data: { name: string; description: string | undefined; isPublic: boolean }) => void;
  isSubmitting: boolean;
};

export function GroupCreateForm({ onBack, onSubmit, isSubmitting }: GroupCreateFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('groups');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [nameError, setNameError] = useState('');

  const themeStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      appbar: { backgroundColor: theme.colors.background },
      description: { color: theme.colors.onSurfaceVariant },
    }),
    [theme.colors.background, theme.colors.onSurfaceVariant],
  );

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
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={t('create.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.formContent}>
        <Text variant="labelLarge" style={styles.label}>
          {t('create.nameLabel')}
        </Text>
        <TextInput
          mode="outlined"
          value={name}
          onChangeText={setName}
          placeholder={t('create.namePlaceholder')}
          error={!!nameError}
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
          mode="outlined"
          value={description}
          onChangeText={setDescription}
          placeholder={t('create.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
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

        <Button
          testID="groups-create-save"
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
        >
          {t('create.save')}
        </Button>
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

import { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, RadioButton, TextInput, Text, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { AppTheme } from '@/shared/theme';

/** All report reason keys, matching i18n profile.report.reasons.* */
export const REPORT_REASONS = [
  'inappropriate',
  'spam',
  'stolenGoods',
  'misleadingCondition',
  'harassment',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

interface ReportDialogProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly onSubmit: (reason: ReportReason, text: string | undefined) => void;
  readonly loading?: boolean;
}

/**
 * Modal dialog for reporting a user or item.
 * Shows a reason radio selector and an optional details text field.
 */
export function ReportDialog({ visible, onDismiss, onSubmit, loading = false }: ReportDialogProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('profile');
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  const themeStyles = useMemo(
    () => ({
      dialog: { backgroundColor: theme.colors.surface },
      reasonLabel: { color: theme.colors.onSurfaceVariant },
      radioLabel: { color: theme.colors.onSurface },
      error: { color: theme.colors.error },
      textInput: {
        backgroundColor: theme.customColors.surfaceContainerHighest,
        borderRadius: borderRadius.md,
      },
    }),
    [
      theme.colors.surface,
      theme.colors.onSurfaceVariant,
      theme.colors.onSurface,
      theme.colors.error,
      theme.customColors.surfaceContainerHighest,
    ],
  );

  const handleSubmit = () => {
    if (!selectedReason) {
      setError(t('report.validationReason'));
      return;
    }
    setError('');
    onSubmit(selectedReason, details.trim() || undefined);
  };

  const handleDismiss = () => {
    setSelectedReason('');
    setDetails('');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        style={[styles.dialog, themeStyles.dialog]}
      >
        <Dialog.Title>{t('report.title')}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView>
            <Text variant="bodyMedium" style={[styles.reasonLabel, themeStyles.reasonLabel]}>
              {t('report.reasonLabel')}
            </Text>

            <RadioButton.Group
              value={selectedReason}
              onValueChange={(value) => {
                setSelectedReason(value as ReportReason);
                if (error) setError('');
              }}
            >
              {REPORT_REASONS.map((reason) => (
                <RadioButton.Item
                  key={reason}
                  label={t(`report.reasons.${reason}`)}
                  value={reason}
                  style={styles.radioItem}
                  labelStyle={themeStyles.radioLabel}
                />
              ))}
            </RadioButton.Group>

            {error ? (
              <Text variant="bodySmall" style={[styles.error, themeStyles.error]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.detailsContainer}>
              <TextInput
                label={t('report.detailsLabel')}
                placeholder={t('report.detailsPlaceholder')}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
                mode="flat"
                style={[themeStyles.textInput, styles.textInput]}
                underlineColor={colorWithAlpha(theme.colors.outlineVariant, 0.15)}
                activeUnderlineColor={theme.colors.primary}
              />
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={handleDismiss} disabled={loading}>
            {t('signOutConfirm.cancel')}
          </Button>
          <GradientButton
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            testID="submit-report-button"
          >
            {t('report.submit')}
          </GradientButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: borderRadius.lg,
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  reasonLabel: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  radioItem: {
    paddingHorizontal: spacing.md,
  },
  error: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  detailsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.base,
    paddingBottom: spacing.base,
  },
  textInput: {
    minHeight: 80,
  },
});

import { StyleSheet } from 'react-native';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/GradientButton';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';

export type ConfirmDialogVariant = 'confirm-cancel' | 'acknowledge';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Defaults to `common.actions.cancel` when `variant` is `confirm-cancel`. */
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  destructive?: boolean;
  loading?: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  testID?: string;
}

/**
 * Shared confirmation / notice dialog (Paper + theme tokens) for web and native.
 * Prefer this over `Alert.alert` / `window.confirm` so UI matches app chrome.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'confirm-cancel',
  destructive = false,
  loading = false,
  onDismiss,
  onConfirm,
  testID = 'confirm-dialog',
}: ConfirmDialogProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('common');

  const resolvedCancel = cancelLabel ?? t('actions.cancel');

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
        testID={testID}
      >
        <Dialog.Title style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
          >
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          {variant === 'confirm-cancel' ? (
            <Button onPress={onDismiss} disabled={loading} testID={`${testID}-cancel`}>
              {resolvedCancel}
            </Button>
          ) : null}
          {destructive ? (
            <Button
              onPress={handleConfirm}
              disabled={loading}
              textColor={theme.colors.error}
              testID={`${testID}-confirm`}
            >
              {confirmLabel}
            </Button>
          ) : (
            <GradientButton
              onPress={handleConfirm}
              loading={loading}
              disabled={loading}
              testID={`${testID}-confirm`}
            >
              {confirmLabel}
            </GradientButton>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: borderRadius.lg,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    paddingBottom: spacing.xs,
  },
  content: {
    paddingTop: 0,
  },
  message: {
    marginBottom: spacing.sm,
  },
  actions: {
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
});

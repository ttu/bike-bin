import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';

export interface RemoveFromInventoryDialogProps {
  visible: boolean;
  onDismiss: () => void;
  /** Shown when the item can be archived (not already archived). */
  onArchive?: () => void;
  /** Shown when the item can be deleted for its current status. */
  onDelete?: () => void;
}

/**
 * Chooses archive vs delete before the usual confirm flows run.
 * Uses Paper Dialog + theme tokens so web and native match app chrome.
 */
export function RemoveFromInventoryDialog({
  visible,
  onDismiss,
  onArchive,
  onDelete,
}: RemoveFromInventoryDialogProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { t: tCommon } = useTranslation('common');

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('detail.removeFromInventoryTitle')}
        </Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('detail.removeFromInventoryMessage')}
          </Text>
          <View
            style={[
              styles.actionPanel,
              { backgroundColor: theme.customColors.surfaceContainerLow },
            ]}
          >
            {onArchive != null ? (
              <Button
                mode="outlined"
                icon="archive-outline"
                onPress={onArchive}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                testID="remove-inventory-archive"
              >
                {t('detail.archive')}
              </Button>
            ) : null}
            {onDelete != null ? (
              <Button
                mode="text"
                icon="delete-outline"
                onPress={onDelete}
                textColor={theme.colors.error}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                testID="remove-inventory-delete"
              >
                {t('deleteItem')}
              </Button>
            ) : null}
            <Button
              mode="text"
              onPress={onDismiss}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              testID="remove-inventory-cancel"
            >
              {tCommon('actions.cancel')}
            </Button>
          </View>
        </Dialog.Content>
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
    marginBottom: spacing.base,
  },
  actionPanel: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    marginVertical: 0,
  },
  actionButtonContent: {
    justifyContent: 'flex-start',
  },
});

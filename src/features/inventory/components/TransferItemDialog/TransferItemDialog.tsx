import { useState, useMemo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { GroupRole, type GroupId, type Item } from '@/shared/types';
import { useGroups } from '@/features/groups';
import type { useTransferItem } from '@/features/inventory/hooks/useTransferItem';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';

export interface TransferItemDialogProps {
  item: Item;
  visible: boolean;
  onDismiss: () => void;
  transferItem: ReturnType<typeof useTransferItem>;
}

export function TransferItemDialog({
  item,
  visible,
  onDismiss,
  transferItem,
}: Readonly<TransferItemDialogProps>) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { t: tCommon } = useTranslation('common');
  const { data: groups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<GroupId | undefined>(undefined);

  const adminGroups = useMemo(
    () => (groups ?? []).filter((g) => g.memberRole === GroupRole.Admin),
    [groups],
  );

  const handleConfirm = () => {
    if (!selectedGroupId) return;
    transferItem.mutate(
      { itemId: item.id, toGroupId: selectedGroupId },
      {
        onSuccess: () => {
          setSelectedGroupId(undefined);
          onDismiss();
        },
      },
    );
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('transfer.title')}
        </Dialog.Title>
        <Dialog.Content>
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('transfer.description')}
          </Text>
          {adminGroups.length === 0 ? (
            <Text
              variant="bodyMedium"
              style={[styles.emptyState, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('transfer.noAdminGroups')}
            </Text>
          ) : (
            adminGroups.map((group) => {
              const selected = selectedGroupId === group.id;
              return (
                <Pressable
                  key={group.id}
                  onPress={() => setSelectedGroupId(group.id)}
                  style={[
                    styles.groupRow,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.customColors.surfaceContainerLow,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <MaterialCommunityIcons
                    name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyLarge"
                    style={[styles.groupName, { color: theme.colors.onSurface }]}
                  >
                    {group.name}
                  </Text>
                </Pressable>
              );
            })
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{tCommon('actions.cancel')}</Button>
          <Button
            onPress={handleConfirm}
            disabled={!selectedGroupId || transferItem.isPending}
            loading={transferItem.isPending}
          >
            {t('transfer.confirm')}
          </Button>
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
    fontWeight: '600',
  },
  description: {
    marginBottom: spacing.md,
  },
  emptyState: {
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  groupName: {
    flex: 1,
  },
});

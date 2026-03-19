import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Button, IconButton, Dialog, Portal, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Item, BikeId } from '@/shared/types';
import { ItemStatus } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import { useItems } from '@/features/inventory';
import { useMountedParts } from '../../hooks/useMountedParts';
import { useAttachPart } from '../../hooks/useAttachPart';
import { useDetachPart } from '../../hooks/useDetachPart';

interface MountedPartsProps {
  bikeId: BikeId;
}

export function MountedParts({ bikeId }: MountedPartsProps) {
  const theme = useTheme();
  const { t } = useTranslation('bikes');

  const { data: mountedParts = [] } = useMountedParts(bikeId);
  const { data: allItems = [] } = useItems();
  const attachMutation = useAttachPart();
  const detachMutation = useDetachPart();

  const [showPicker, setShowPicker] = useState(false);
  const [detachTarget, setDetachTarget] = useState<Item | undefined>(undefined);

  // Available parts: stored items not already mounted on any bike
  const availableParts = allItems.filter(
    (item) => item.status === ItemStatus.Stored && !item.bikeId,
  );

  const handleAttach = useCallback(
    (itemId: Item['id']) => {
      attachMutation.mutate({ itemId, bikeId });
      setShowPicker(false);
    },
    [attachMutation, bikeId],
  );

  const handleDetachConfirm = useCallback(() => {
    if (detachTarget) {
      detachMutation.mutate({ itemId: detachTarget.id, bikeId });
      setDetachTarget(undefined);
    }
  }, [detachMutation, detachTarget, bikeId]);

  const renderMountedItem = useCallback(
    ({ item }: { item: Item }) => (
      <View style={[styles.partRow, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.partInfo}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            {item.name}
          </Text>
          {item.brand && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.brand}
              {item.model ? ` ${item.model}` : ''}
            </Text>
          )}
        </View>
        <IconButton
          icon="close-circle-outline"
          onPress={() => setDetachTarget(item)}
          accessibilityLabel={t('detail.detach')}
        />
      </View>
    ),
    [theme, t],
  );

  const renderPickerItem = useCallback(
    ({ item }: { item: Item }) => (
      <View style={[styles.partRow, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.partInfo}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            {item.name}
          </Text>
          {item.brand && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {item.brand}
            </Text>
          )}
        </View>
        <Button compact mode="text" onPress={() => handleAttach(item.id)}>
          {t('detail.attachPart')}
        </Button>
      </View>
    ),
    [theme, t, handleAttach],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
          {t('detail.mountedParts')}
        </Text>
        <Button mode="text" compact onPress={() => setShowPicker(true)} icon="plus">
          {t('detail.attachPart')}
        </Button>
      </View>

      {mountedParts.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            {t('detail.noPartsDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={mountedParts}
          renderItem={renderMountedItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

      {/* Attach picker dialog */}
      <Portal>
        <Dialog visible={showPicker} onDismiss={() => setShowPicker(false)}>
          <Dialog.Title>{t('detail.selectPart')}</Dialog.Title>
          <Dialog.Content>
            {availableParts.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('detail.noAvailableParts')}
              </Text>
            ) : (
              <FlatList
                data={availableParts}
                renderItem={renderPickerItem}
                keyExtractor={(item) => item.id}
                style={styles.pickerList}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPicker(false)}>{t('detail.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Detach confirmation dialog */}
      <Portal>
        <Dialog visible={!!detachTarget} onDismiss={() => setDetachTarget(undefined)}>
          <Dialog.Title>{t('detail.detach')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('detail.confirmDetach', { name: detachTarget?.name })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetachTarget(undefined)}>{t('detail.cancel')}</Button>
            <Button onPress={handleDetachConfirm}>{t('detail.confirmDetachAction')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  emptyState: {
    marginHorizontal: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.base,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  partInfo: {
    flex: 1,
  },
  pickerList: {
    maxHeight: 300,
  },
});

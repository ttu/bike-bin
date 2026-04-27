import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Text, Button, IconButton, Dialog, Portal, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ItemStatus, type BikeId, type Item } from '@/shared/types';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { useItems } from '@/features/inventory';
import { useMountedParts } from '../../hooks/useMountedParts';
import { useAttachPart } from '../../hooks/useAttachPart';
import { useDetachPart } from '../../hooks/useDetachPart';

interface MountedPartsProps {
  bikeId: BikeId;
}

export function MountedParts({ bikeId }: MountedPartsProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');
  const themed = useThemedStyles(theme);

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
      <View style={[styles.partRow, themed.surfaceBg]}>
        <Pressable
          style={styles.partInfo}
          onPress={() =>
            router.push(`/(tabs)/inventory/${item.id}?fromBike=${encodeURIComponent(bikeId)}`)
          }
          accessibilityRole="button"
          accessibilityLabel={t('detail.viewPart', { name: item.name })}
        >
          <Text variant="bodyLarge" style={themed.onSurface}>
            {item.name}
          </Text>
          {item.brand && (
            <Text variant="bodySmall" style={themed.onSurfaceVariant}>
              {item.brand}
              {item.model ? ` ${item.model}` : ''}
            </Text>
          )}
        </Pressable>
        <IconButton
          icon="close-circle-outline"
          onPress={() => setDetachTarget(item)}
          accessibilityLabel={t('detail.detach')}
        />
      </View>
    ),
    [themed, t, bikeId],
  );

  const renderPickerItem = useCallback(
    ({ item }: { item: Item }) => (
      <View style={[styles.partRow, themed.surfaceBg]}>
        <View style={styles.partInfo}>
          <Text variant="bodyLarge" style={themed.onSurface}>
            {item.name}
          </Text>
          {item.brand && (
            <Text variant="bodySmall" style={themed.onSurfaceVariant}>
              {item.brand}
            </Text>
          )}
        </View>
        <Button compact mode="text" onPress={() => handleAttach(item.id)}>
          {t('detail.attachPart')}
        </Button>
      </View>
    ),
    [themed, t, handleAttach],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={themed.onBackground}>
          {t('detail.mountedParts')}
        </Text>
        <Button mode="text" compact onPress={() => setShowPicker(true)} icon="plus">
          {t('detail.attachPart')}
        </Button>
      </View>

      {mountedParts.length === 0 ? (
        <View style={[styles.emptyState, themed.surfaceVariantBg]}>
          <Text variant="bodyMedium" style={[themed.onSurfaceVariant, styles.emptyText]}>
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
              <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
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

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        onBackground: { color: theme.colors.onBackground },
        surfaceBg: { backgroundColor: theme.colors.surface },
        surfaceVariantBg: { backgroundColor: theme.colors.surfaceVariant },
      }),
    [theme],
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
  emptyText: {
    textAlign: 'center',
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

import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Appbar, Text, FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { SavedLocation } from '@/shared/types';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { ConfirmDialog } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  DeleteLocationError,
  LocationCard,
  LocationForm,
} from '@/features/locations';
import type { GeocodeResult } from '@/features/locations';
import {
  spacing,
  borderRadius,
  iconSize,
  fabOffsetAboveTabBar,
  fabListScrollPaddingBottom,
} from '@/shared/theme';

type ScreenMode = 'list' | 'add' | 'edit';

export default function SavedLocationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('locations');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const [mode, setMode] = useState<ScreenMode>('list');
  const [editingLocation, setEditingLocation] = useState<SavedLocation | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<SavedLocation | null>(null);

  const { data: locations, isLoading, refetch } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const handleAddPress = useCallback(() => {
    setEditingLocation(undefined);
    setMode('add');
  }, []);

  const handleEditPress = useCallback((location: SavedLocation) => {
    setEditingLocation(location);
    setMode('edit');
  }, []);

  const handleCancel = useCallback(() => {
    setMode('list');
    setEditingLocation(undefined);
  }, []);

  const handleSaveNew = useCallback(
    async (data: {
      postcode: string;
      label: string;
      isPrimary: boolean;
      geocoded: GeocodeResult;
    }) => {
      try {
        await createLocation.mutateAsync({
          postcode: data.postcode,
          label: data.label,
          isPrimary: data.isPrimary,
        });
        setMode('list');
      } catch {
        showSnackbarAlert({ message: t('errors.saveFailed'), variant: 'error' });
      }
    },
    [createLocation, showSnackbarAlert, t],
  );

  const handleSaveEdit = useCallback(
    async (data: {
      postcode: string;
      label: string;
      isPrimary: boolean;
      geocoded: GeocodeResult;
    }) => {
      if (!editingLocation) return;

      try {
        await updateLocation.mutateAsync({
          id: editingLocation.id,
          label: data.label,
          postcode: data.postcode,
          isPrimary: data.isPrimary,
        });
        setMode('list');
        setEditingLocation(undefined);
      } catch {
        showSnackbarAlert({ message: t('errors.saveFailed'), variant: 'error' });
      }
    },
    [editingLocation, showSnackbarAlert, updateLocation, t],
  );

  const handleDelete = useCallback((location: SavedLocation) => {
    setDeleteTarget(location);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteLocation.mutateAsync(targetId);
    } catch (e) {
      if (e instanceof DeleteLocationError) {
        if (e.code === 'LAST_LOCATION') {
          showSnackbarAlert({ message: t('delete.lastLocation'), variant: 'error' });
        } else if (e.code === 'HAS_ITEMS') {
          showSnackbarAlert({ message: t('delete.hasItems'), variant: 'error' });
        }
      } else {
        showSnackbarAlert({ message: t('errors.deleteFailed'), variant: 'error' });
      }
    }
  }, [deleteTarget, deleteLocation, showSnackbarAlert, t]);

  const renderItem = useCallback(
    ({ item }: { item: SavedLocation }) => (
      <LocationCard location={item} onPress={handleEditPress} onDelete={handleDelete} />
    ),
    [handleEditPress, handleDelete],
  );

  // Show form when adding or editing
  if (mode === 'add') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={handleCancel} />
          <Appbar.Content title={t('addLocation')} />
        </Appbar.Header>
        <LocationForm
          onSave={handleSaveNew}
          onCancel={handleCancel}
          isSubmitting={createLocation.isPending}
        />
      </View>
    );
  }

  if (mode === 'edit' && editingLocation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={handleCancel} />
          <Appbar.Content title={t('editLocation')} />
        </Appbar.Header>
        <LocationForm
          initialData={{
            postcode: editingLocation.postcode ?? '',
            label: editingLocation.label,
            isPrimary: editingLocation.isPrimary,
          }}
          onSave={handleSaveEdit}
          onCancel={handleCancel}
          isSubmitting={updateLocation.isPending}
        />
      </View>
    );
  }

  // List mode
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
        <Appbar.Content title={t('title')} />
      </Appbar.Header>

      {!isLoading && (locations ?? []).length === 0 ? (
        <EmptyState
          icon="map-marker-plus"
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCtaPress={handleAddPress}
        />
      ) : (
        <FlatList
          data={locations ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: fabListScrollPaddingBottom(insets.bottom) }}
          ListFooterComponent={
            <Pressable
              onPress={handleAddPress}
              style={[
                styles.addCard,
                {
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('addLocation')}
            >
              <MaterialCommunityIcons name="plus" size={iconSize.lg} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                {t('addLocation')}
              </Text>
            </Pressable>
          }
        />
      )}

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: fabOffsetAboveTabBar(insets.bottom),
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={handleAddPress}
        accessibilityLabel={t('addLocation')}
      />

      <ConfirmDialog
        visible={deleteTarget !== null}
        title={t('delete.title')}
        message={t('delete.confirm')}
        cancelLabel={t('form.cancel')}
        confirmLabel={t('delete.title')}
        destructive
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});

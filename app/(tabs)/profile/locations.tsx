import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { SavedLocation } from '@/shared/types';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { ConfirmDialog } from '@/shared/components';
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
import { spacing, borderRadius, iconSize } from '@/shared/theme';

type ScreenMode = 'list' | 'add' | 'edit';

export default function SavedLocationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('locations');
  const { t: tCommon } = useTranslation('common');
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [editingLocation, setEditingLocation] = useState<SavedLocation | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<SavedLocation | null>(null);
  const [acknowledge, setAcknowledge] = useState<{ title: string; message: string } | null>(null);

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
        setAcknowledge({
          title: tCommon('alerts.errorTitle'),
          message: t('errors.saveFailed'),
        });
      }
    },
    [createLocation, t, tCommon],
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
        setAcknowledge({
          title: tCommon('alerts.errorTitle'),
          message: t('errors.saveFailed'),
        });
      }
    },
    [editingLocation, updateLocation, t, tCommon],
  );

  const handleDelete = useCallback((location: SavedLocation) => {
    setDeleteTarget(location);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    void (async () => {
      try {
        await deleteLocation.mutateAsync(targetId);
      } catch (e) {
        if (e instanceof DeleteLocationError) {
          if (e.code === 'LAST_LOCATION') {
            setAcknowledge({
              title: tCommon('alerts.noticeTitle'),
              message: t('delete.lastLocation'),
            });
          } else if (e.code === 'HAS_ITEMS') {
            setAcknowledge({
              title: tCommon('alerts.noticeTitle'),
              message: t('delete.hasItems'),
            });
          }
        } else {
          setAcknowledge({
            title: tCommon('alerts.errorTitle'),
            message: t('errors.deleteFailed'),
          });
        }
      }
    })();
  }, [deleteTarget, deleteLocation, t, tCommon]);

  const renderItem = useCallback(
    ({ item }: { item: SavedLocation }) => (
      <LocationCard location={item} onPress={handleEditPress} onDelete={handleDelete} />
    ),
    [handleEditPress, handleDelete],
  );

  // Show form when adding or editing
  if (mode === 'add') {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleCancel} accessibilityRole="button">
            <MaterialCommunityIcons
              name="arrow-left"
              size={iconSize.md}
              color={theme.colors.onBackground}
            />
          </Pressable>
          <Text
            variant="headlineMedium"
            style={[styles.headerTitle, { color: theme.colors.onBackground }]}
          >
            {t('addLocation')}
          </Text>
        </View>
        <LocationForm
          onSave={handleSaveNew}
          onCancel={handleCancel}
          isSubmitting={createLocation.isPending}
        />
        <ConfirmDialog
          visible={acknowledge !== null}
          title={acknowledge?.title ?? ''}
          message={acknowledge?.message ?? ''}
          confirmLabel={tCommon('actions.ok')}
          variant="acknowledge"
          onDismiss={() => setAcknowledge(null)}
          onConfirm={() => setAcknowledge(null)}
        />
      </View>
    );
  }

  if (mode === 'edit' && editingLocation) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleCancel} accessibilityRole="button">
            <MaterialCommunityIcons
              name="arrow-left"
              size={iconSize.md}
              color={theme.colors.onBackground}
            />
          </Pressable>
          <Text
            variant="headlineMedium"
            style={[styles.headerTitle, { color: theme.colors.onBackground }]}
          >
            {t('editLocation')}
          </Text>
        </View>
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
        <ConfirmDialog
          visible={acknowledge !== null}
          title={acknowledge?.title ?? ''}
          message={acknowledge?.message ?? ''}
          confirmLabel={tCommon('actions.ok')}
          variant="acknowledge"
          onDismiss={() => setAcknowledge(null)}
          onConfirm={() => setAcknowledge(null)}
        />
      </View>
    );
  }

  // List mode
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => tabScopedBack('/(tabs)/profile')} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={iconSize.md}
            color={theme.colors.onBackground}
          />
        </Pressable>
        <Text
          variant="headlineMedium"
          style={[styles.headerTitle, { color: theme.colors.onBackground }]}
        >
          {t('title')}
        </Text>
      </View>

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
          contentContainerStyle={styles.list}
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
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
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
      <ConfirmDialog
        visible={acknowledge !== null}
        title={acknowledge?.title ?? ''}
        message={acknowledge?.message ?? ''}
        confirmLabel={tCommon('actions.ok')}
        variant="acknowledge"
        onDismiss={() => setAcknowledge(null)}
        onConfirm={() => setAcknowledge(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  list: {
    paddingBottom: 80,
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

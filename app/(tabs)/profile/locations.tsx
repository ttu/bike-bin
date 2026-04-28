import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable, type ListRenderItem } from 'react-native';
import { Appbar, Text, FAB as Fab, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { SavedLocation } from '@/shared/types';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { ConfirmDialog } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useValidationErrorSnackbar } from '@/shared/hooks/useValidationErrorSnackbar';
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
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const [mode, setMode] = useState<ScreenMode>('list');
  const [editingLocation, setEditingLocation] = useState<SavedLocation | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<SavedLocation | null>(null);

  const { data: locations, isLoading, isRefetching, refetch } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const listModeDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        contentContainer: {
          paddingBottom: fabListScrollPaddingBottom(insets.bottom),
        },
        fabDynamic: {
          backgroundColor: theme.colors.primary,
          bottom: fabOffsetAboveTabBar(insets.bottom),
        },
      }),
    [insets.bottom, theme.colors.primary],
  );

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

  const handleLocationValidationError = useValidationErrorSnackbar();

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
        showSnackbarAlert({
          message: tCommon('feedback.locationSaved'),
          variant: 'success',
        });
        setMode('list');
      } catch {
        showSnackbarAlert({ message: t('errors.saveFailed'), variant: 'error' });
      }
    },
    [createLocation, showSnackbarAlert, t, tCommon],
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
        showSnackbarAlert({
          message: tCommon('feedback.locationSaved'),
          variant: 'success',
        });
        setMode('list');
        setEditingLocation(undefined);
      } catch {
        showSnackbarAlert({ message: t('errors.saveFailed'), variant: 'error' });
      }
    },
    [editingLocation, showSnackbarAlert, updateLocation, t, tCommon],
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
      showSnackbarAlert({
        message: tCommon('feedback.locationDeleted'),
        variant: 'success',
      });
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
  }, [deleteTarget, deleteLocation, showSnackbarAlert, t, tCommon]);

  const renderItem = useCallback<ListRenderItem<SavedLocation>>(
    ({ item }) => <LocationCard location={item} onPress={handleEditPress} onDelete={handleDelete} />,
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
          onValidationError={handleLocationValidationError}
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
          onValidationError={handleLocationValidationError}
        />
      </View>
    );
  }

  const locationsList = locations ?? [];

  const renderLocationsBody = () => {
    if (locationsList.length === 0) {
      if (isLoading) {
        return <CenteredLoadingIndicator />;
      }
      return (
        <EmptyState
          icon="map-marker-plus"
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCtaPress={handleAddPress}
        />
      );
    }
    return (
      <FlatList
        testID="saved-locations-list"
        data={locationsList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={listModeDynamicStyles.contentContainer}
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
    );
  };

  // List mode
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          testID="saved-locations-screen-back"
          onPress={() => tabScopedBack('/(tabs)/profile')}
        />
        <Appbar.Content title={t('title')} />
      </Appbar.Header>

      {renderLocationsBody()}

      <Fab
        icon="plus"
        style={[styles.fab, listModeDynamicStyles.fabDynamic]}
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

import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, Pressable } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { SavedLocation } from '@/shared/types';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
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
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [editingLocation, setEditingLocation] = useState<SavedLocation | undefined>(undefined);

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
        Alert.alert(t('errors.saveFailed'));
      }
    },
    [createLocation, t],
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
        Alert.alert(t('errors.saveFailed'));
      }
    },
    [editingLocation, updateLocation, t],
  );

  const handleDelete = useCallback(
    (location: SavedLocation) => {
      Alert.alert(t('delete.title'), t('delete.confirm'), [
        { text: t('form.cancel'), style: 'cancel' },
        {
          text: t('delete.title'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation.mutateAsync(location.id);
            } catch (e) {
              if (e instanceof DeleteLocationError) {
                if (e.code === 'LAST_LOCATION') {
                  Alert.alert(t('delete.lastLocation'));
                } else if (e.code === 'HAS_ITEMS') {
                  Alert.alert(t('delete.hasItems'));
                }
              } else {
                Alert.alert(t('errors.deleteFailed'));
              }
            }
          },
        },
      ]);
    },
    [deleteLocation, t],
  );

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

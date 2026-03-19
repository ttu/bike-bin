import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Item, ItemCategory } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { SyncBanner } from '@/features/auth/components/SyncBanner/SyncBanner';
import { useLocalInventory } from '@/features/auth/hooks/useLocalInventory';
import { useItems } from '@/features/inventory';
import { ItemCard } from '@/features/inventory/components/ItemCard/ItemCard';
import { CategoryFilter } from '@/features/inventory/components/CategoryFilter/CategoryFilter';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { spacing } from '@/shared/theme';

export default function InventoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(undefined);

  // Server items (authenticated) or local items (unauthenticated)
  const { data: serverItems, isLoading: serverLoading, refetch } = useItems();
  const { items: localItems, isLoading: localLoading } = useLocalInventory();

  const items = isAuthenticated ? (serverItems ?? []) : localItems;
  const isLoading = isAuthenticated ? serverLoading : localLoading;

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const handleItemPress = useCallback((item: Item) => {
    router.push(`/(tabs)/inventory/${item.id}` as never);
  }, []);

  const handleAddPress = useCallback(() => {
    router.push('/(tabs)/inventory/new' as never);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ItemCard item={item} onPress={handleItemPress} />,
    [handleItemPress],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('title')}
        </Text>
      </View>

      <SyncBanner />

      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      {!isLoading && filteredItems.length === 0 ? (
        <EmptyState
          icon="package-variant"
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCtaPress={handleAddPress}
        />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            isAuthenticated ? (
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            ) : undefined
          }
          contentContainerStyle={styles.list}
        />
      )}

      {filteredItems.length > 0 && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={handleAddPress}
          accessibilityLabel={t('addItem')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});

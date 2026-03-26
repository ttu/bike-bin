import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, FAB, Chip, Searchbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Item, ItemCategory } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { SyncBanner } from '@/features/auth/components/SyncBanner/SyncBanner';
import { useLocalInventory } from '@/features/auth/hooks/useLocalInventory';
import { useItems, useUserTags } from '@/features/inventory';
import { ItemCard } from '@/features/inventory/components/ItemCard/ItemCard';
import { CategoryFilter } from '@/features/inventory/components/CategoryFilter/CategoryFilter';
import { isTerminalStatus } from '@/features/inventory/utils/status';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { DemoBanner } from '@/features/demo';
import { spacing } from '@/shared/theme';

function matchesSearch(item: Item, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(q) ||
    (item.brand?.toLowerCase().includes(q) ?? false) ||
    (item.model?.toLowerCase().includes(q) ?? false)
  );
}

export default function InventoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const { data: userTags } = useUserTags();

  const { data: serverItems, isLoading: serverLoading, refetch } = useItems();
  const { items: localItems, isLoading: localLoading } = useLocalInventory();

  const items = isAuthenticated ? (serverItems ?? []) : localItems;
  const isLoading = isAuthenticated ? serverLoading : localLoading;

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      result = result.filter((item) => matchesSearch(item, searchQuery.trim()));
    }
    if (selectedTags.length > 0) {
      result = result.filter((item) => item.tags.some((tag) => selectedTags.includes(tag)));
    }
    if (!showTerminal) {
      result = result.filter((item) => !isTerminalStatus(item.status));
    }
    return result;
  }, [items, selectedCategory, searchQuery, selectedTags, showTerminal]);

  const terminalCount = useMemo(
    () => items.filter((item) => isTerminalStatus(item.status)).length,
    [items],
  );
  const hasTerminalItems = terminalCount > 0;

  const handleItemPress = useCallback((item: Item) => {
    router.push(`/(tabs)/inventory/${item.id}` as never);
  }, []);

  const handleAddPress = useCallback(() => {
    if (selectedCategory) {
      router.push(`/(tabs)/inventory/new?category=${selectedCategory}` as never);
    } else {
      router.push('/(tabs)/inventory/new' as never);
    }
  }, [selectedCategory]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ItemCard item={item} onPress={handleItemPress} />,
    [handleItemPress],
  );

  const searchPlaceholder =
    filteredItems.length > 0
      ? t('searchPlaceholder', { count: filteredItems.length })
      : t('searchPlaceholderEmpty');

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={searchPlaceholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={styles.searchInput}
          elevation={0}
        />
      </View>

      <DemoBanner />
      <SyncBanner />

      <Text
        variant="labelLarge"
        style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('categoriesLabel')}
      </Text>
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      {userTags && userTags.length > 0 && (
        <>
          <Text
            variant="labelLarge"
            style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('tagsLabel')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagFilterRow}
          >
            {userTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  selected={active}
                  onPress={() => toggleTag(tag)}
                  showSelectedCheck={false}
                  style={active ? { backgroundColor: theme.colors.primary } : undefined}
                  textStyle={active ? { color: theme.colors.onPrimary } : undefined}
                  compact
                >
                  {tag}
                </Chip>
              );
            })}
          </ScrollView>
        </>
      )}

      {hasTerminalItems && (
        <View style={styles.terminalChipRow}>
          <Chip
            selected={showTerminal}
            onPress={() => setShowTerminal((prev) => !prev)}
            showSelectedCheck={false}
            style={showTerminal ? { backgroundColor: theme.colors.primary } : undefined}
            textStyle={showTerminal ? { color: theme.colors.onPrimary } : undefined}
            compact
          >
            {t('filters.showInactive', { count: terminalCount })}
          </Chip>
        </View>
      )}

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
          style={styles.listContainer}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            isAuthenticated ? (
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            ) : undefined
          }
          contentContainerStyle={styles.list}
          ListFooterComponent={
            filteredItems.length > 0 ? (
              <Text
                variant="bodySmall"
                style={[styles.itemCount, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('showingItems', { count: filteredItems.length })}
              </Text>
            ) : undefined
          }
        />
      )}

      {filteredItems.length > 0 && (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary, bottom: spacing.base + insets.bottom + 60 },
          ]}
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
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: 28,
  },
  searchInput: {
    minHeight: 0,
  },
  sectionLabel: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  itemCount: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  tagFilterRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  terminalChipRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});

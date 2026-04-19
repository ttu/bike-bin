import { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Text, FAB, Chip, Searchbar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Item, ItemCategory } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { SyncBanner } from '@/features/auth/components/SyncBanner/SyncBanner';
import { useLocalInventory } from '@/features/inventory/hooks/useLocalInventory';
import { useItems, useUserTags, useInventoryRowCapacity } from '@/features/inventory';
import { ItemCard } from '@/features/inventory/components/ItemCard/ItemCard';
import { ItemGalleryTile } from '@/features/inventory/components/ItemGalleryTile/ItemGalleryTile';
import { FeaturedItemCard } from '@/features/inventory/components/FeaturedItemCard/FeaturedItemCard';
import { CategoryFilter } from '@/features/inventory/components/CategoryFilter/CategoryFilter';
import { isTerminalStatus } from '@/features/inventory/utils/status';
import { sortItems, type InventorySortOption } from '@/features/inventory/utils/sortItems';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { DemoBanner } from '@/features/demo';
import {
  borderRadius,
  fabListScrollPaddingBottom,
  fabOffsetAboveTabBar,
  iconSize,
  spacing,
} from '@/shared/theme';
import { ITEM_INVENTORY_THUMBNAIL } from '@/features/inventory/constants';

type InventoryViewMode = 'list' | 'gallery';

const SORT_OPTIONS: InventorySortOption[] = ['recentlyAdded', 'recentlyUpdated', 'name'];

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
  const { width: windowWidth } = useWindowDimensions();
  const { isAuthenticated } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [viewMode, setViewMode] = useState<InventoryViewMode>('list');
  const [sortOption, setSortOption] = useState<InventorySortOption>('recentlyAdded');
  const [tagFilterExpanded, setTagFilterExpanded] = useState(false);
  const { data: userTags } = useUserTags();

  const activeTags = useMemo(
    () => (userTags ? selectedTags.filter((tag) => userTags.includes(tag)) : selectedTags),
    [selectedTags, userTags],
  );

  const {
    data: serverItems,
    isLoading: serverLoading,
    isRefetching: serverRefetching,
    refetch,
  } = useItems();
  const { items: localItems, isLoading: localLoading } = useLocalInventory();
  const { atLimit, limit, isReady: capacityReady } = useInventoryRowCapacity();

  const items = useMemo(
    () => (isAuthenticated ? (serverItems ?? []) : localItems),
    [isAuthenticated, serverItems, localItems],
  );
  const isLoading = isAuthenticated ? serverLoading : localLoading;
  /** Full-area loading below the search bar (matches bikes tab); avoids ListEmptyComponent without flexGrow. */
  const showInitialLoading = isLoading && items.length === 0;

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      result = result.filter((item) => matchesSearch(item, searchQuery.trim()));
    }
    if (activeTags.length > 0) {
      result = result.filter((item) => item.tags.some((tag) => activeTags.includes(tag)));
    }
    if (!showTerminal) {
      result = result.filter((item) => !isTerminalStatus(item.status));
    }
    return sortItems(result, sortOption);
  }, [items, selectedCategory, searchQuery, activeTags, showTerminal, sortOption]);

  const heroItem = useMemo(() => {
    if (
      (sortOption !== 'recentlyAdded' && sortOption !== 'recentlyUpdated') ||
      filteredItems.length === 0 ||
      viewMode === 'gallery'
    ) {
      return undefined;
    }
    return filteredItems[0];
  }, [sortOption, filteredItems, viewMode]);

  const listItems = useMemo(
    () => (heroItem ? filteredItems.slice(1) : filteredItems),
    [heroItem, filteredItems],
  );

  const terminalCount = useMemo(
    () => items.filter((item) => isTerminalStatus(item.status)).length,
    [items],
  );
  const hasTerminalItems = terminalCount > 0;

  const galleryColumnCount = useMemo(() => {
    const horizontalPadding = spacing.base * 2;
    const gap = spacing.xs;
    const cellStride = ITEM_INVENTORY_THUMBNAIL.width + gap;
    const columns = Math.floor((windowWidth - horizontalPadding) / cellStride);
    return Math.max(2, Math.min(12, columns));
  }, [windowWidth]);

  const handleItemPress = useCallback((item: Item) => {
    router.push(`/(tabs)/inventory/${item.id}`);
  }, []);

  const blockNewItems = isAuthenticated && capacityReady && atLimit;

  const handleAddPress = useCallback(() => {
    if (blockNewItems) {
      return;
    }
    if (selectedCategory) {
      router.push(`/(tabs)/inventory/new?category=${selectedCategory}`);
    } else {
      router.push('/(tabs)/inventory/new');
    }
  }, [blockNewItems, selectedCategory]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((mode) => (mode === 'list' ? 'gallery' : 'list'));
  }, []);

  const cycleSortOption = useCallback(() => {
    setSortOption((current) => {
      const idx = SORT_OPTIONS.indexOf(current);
      return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
    });
  }, []);

  const toggleTerminal = useCallback(() => {
    setShowTerminal((prev) => !prev);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Item }) =>
      viewMode === 'gallery' ? (
        <View style={styles.galleryCell}>
          <ItemGalleryTile item={item} onPress={handleItemPress} />
        </View>
      ) : (
        <ItemCard item={item} onPress={handleItemPress} />
      ),
    [handleItemPress, viewMode],
  );

  const searchPlaceholder =
    filteredItems.length > 0
      ? t('searchPlaceholder', { count: filteredItems.length })
      : t('searchPlaceholderEmpty');

  const hasTagsOrArchived = (userTags && userTags.length > 0) || hasTerminalItems;
  const tagSectionVisible = tagFilterExpanded || selectedTags.length > 0;
  const tagChipLabel =
    selectedTags.length > 0 ? `${t('tagsLabel')} (${selectedTags.length})` : t('tagsLabel');
  const tagChipActive = tagFilterExpanded || selectedTags.length > 0;

  const toggleTagFilter = useCallback(() => {
    setTagFilterExpanded((prev) => !prev);
  }, []);

  const sortButtonVariant = useMemo(
    () => ({ backgroundColor: theme.colors.surfaceVariant }),
    [theme.colors.surfaceVariant],
  );
  const sortLabel = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  );

  const listHeader = useMemo(
    () => (
      <>
        <DemoBanner />
        <SyncBanner />

        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        {filteredItems.length > 0 && (
          <View style={styles.sortRow}>
            <Pressable
              onPress={cycleSortOption}
              style={({ pressed }) => [
                styles.sortButton,
                sortButtonVariant,
                pressed && styles.sortButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${t('sort.label')}, ${t(`sort.${sortOption}`)}, ${t('sort.hint')}`}
            >
              <MaterialCommunityIcons
                name="sort"
                size={iconSize.sm}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="labelMedium" style={sortLabel}>
                {t(`sort.${sortOption}`)}
              </Text>
            </Pressable>
          </View>
        )}

        {hasTagsOrArchived && (
          <View style={styles.secondaryFilterRow}>
            {userTags && userTags.length > 0 && (
              <Chip
                selected={tagChipActive}
                onPress={toggleTagFilter}
                showSelectedCheck={false}
                compact
                textStyle={tagChipActive ? { color: theme.colors.onPrimary } : undefined}
                style={[
                  styles.tagFilterChip,
                  {
                    backgroundColor: tagChipActive
                      ? theme.colors.primary
                      : theme.colors.secondaryContainer,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: tagChipActive }}
              >
                {tagChipLabel}
              </Chip>
            )}
            {hasTerminalItems && (
              <Chip
                selected={showTerminal}
                onPress={toggleTerminal}
                showSelectedCheck={false}
                compact
                style={showTerminal ? { backgroundColor: theme.colors.primary } : undefined}
                textStyle={showTerminal ? { color: theme.colors.onPrimary } : undefined}
              >
                {t('filters.showInactive', { count: terminalCount })}
              </Chip>
            )}
          </View>
        )}

        {heroItem && (
          <FeaturedItemCard
            item={heroItem}
            onPress={handleItemPress}
            badgeLabel={t(`sort.${sortOption}`)}
          />
        )}

        {tagSectionVisible && userTags && userTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagFilterScroll}
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
                  compact
                  textStyle={active ? { color: theme.colors.onPrimary } : undefined}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.secondaryContainer,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  {tag}
                </Chip>
              );
            })}
          </ScrollView>
        )}
      </>
    ),
    [
      theme.colors,
      t,
      userTags,
      selectedTags,
      selectedCategory,
      hasTerminalItems,
      hasTagsOrArchived,
      terminalCount,
      showTerminal,
      tagChipActive,
      tagChipLabel,
      tagSectionVisible,
      toggleTag,
      toggleTerminal,
      toggleTagFilter,
      sortOption,
      sortButtonVariant,
      sortLabel,
      cycleSortOption,
      filteredItems.length,
      heroItem,
      handleItemPress,
    ],
  );

  const listEmpty = useMemo(
    () =>
      !isLoading && filteredItems.length === 0 ? (
        <EmptyState
          icon="package-variant"
          title={t('empty.title')}
          description={
            blockNewItems ? t('limit.emptyStateDescription', { limit }) : t('empty.description')
          }
          ctaLabel={t('empty.cta')}
          onCtaPress={handleAddPress}
          ctaDisabled={blockNewItems}
        />
      ) : null,
    [isLoading, filteredItems.length, t, blockNewItems, limit, handleAddPress],
  );

  const listContentContainerStyle = useMemo(
    () => [
      { paddingBottom: fabListScrollPaddingBottom(insets.bottom) },
      listItems.length === 0 && !heroItem ? styles.listContentContainerEmpty : undefined,
    ],
    [insets.bottom, listItems.length, heroItem],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchbarWrap}>
          <Searchbar
            placeholder={searchPlaceholder}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
            inputStyle={styles.searchInput}
            elevation={0}
          />
        </View>
        {!isLoading && filteredItems.length > 0 && (
          <Pressable
            onPress={toggleViewMode}
            accessibilityRole="switch"
            accessibilityLabel={t('viewMode.toggleA11y')}
            accessibilityState={{ checked: viewMode === 'gallery' }}
            style={({ pressed }) => [
              styles.viewModeToggle,
              { backgroundColor: theme.colors.surfaceVariant },
              pressed && styles.viewModeTogglePressed,
            ]}
          >
            <MaterialCommunityIcons
              name="view-list"
              size={iconSize.sm}
              color={viewMode === 'list' ? theme.colors.primary : theme.colors.onSurfaceVariant}
              importantForAccessibility="no"
            />
            <MaterialCommunityIcons
              name="view-grid"
              size={iconSize.sm}
              color={viewMode === 'gallery' ? theme.colors.primary : theme.colors.onSurfaceVariant}
              importantForAccessibility="no"
            />
          </Pressable>
        )}
      </View>

      {showInitialLoading ? (
        <CenteredLoadingIndicator />
      ) : (
        <FlatList
          testID="inventory-items-list"
          key={viewMode === 'gallery' ? `gallery-${galleryColumnCount}` : 'list'}
          style={styles.listContainer}
          data={listItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'gallery' ? galleryColumnCount : 1}
          columnWrapperStyle={viewMode === 'gallery' ? styles.galleryRow : undefined}
          extraData={viewMode}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            isAuthenticated ? (
              <RefreshControl refreshing={serverRefetching} onRefresh={refetch} />
            ) : undefined
          }
          contentContainerStyle={listContentContainerStyle}
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
            { backgroundColor: theme.colors.primary, bottom: fabOffsetAboveTabBar(insets.bottom) },
          ]}
          color={theme.colors.onPrimary}
          onPress={handleAddPress}
          disabled={blockNewItems}
          accessibilityLabel={blockNewItems ? t('limit.reachedFabA11y') : t('addItem')}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  searchbarWrap: {
    flex: 1,
    minWidth: 0,
  },
  viewModeToggle: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
  },
  viewModeTogglePressed: {
    opacity: 0.72,
  },
  searchbar: {
    borderRadius: borderRadius.xl,
  },
  searchInput: {
    minHeight: 0,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
  },
  sortButtonPressed: {
    opacity: 0.72,
  },
  secondaryFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  listContentContainerEmpty: {
    flexGrow: 1,
  },
  itemCount: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  tagFilterScroll: {
    flexGrow: 0,
  },
  tagFilterRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tagFilterChip: {
    height: 36,
  },
  tagChip: {
    height: 36,
  },
  galleryRow: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  galleryCell: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});

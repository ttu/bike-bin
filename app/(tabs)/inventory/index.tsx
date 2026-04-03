import { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Text, FAB, Chip, Searchbar, Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Item, ItemCategory } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { SyncBanner } from '@/features/auth/components/SyncBanner/SyncBanner';
import { useLocalInventory } from '@/features/inventory/hooks/useLocalInventory';
import { useItems, useUserTags } from '@/features/inventory';
import { ItemCard } from '@/features/inventory/components/ItemCard/ItemCard';
import { ItemGalleryTile } from '@/features/inventory/components/ItemGalleryTile/ItemGalleryTile';
import { CategoryFilter } from '@/features/inventory/components/CategoryFilter/CategoryFilter';
import { isTerminalStatus } from '@/features/inventory/utils/status';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { DemoBanner } from '@/features/demo';
import { spacing } from '@/shared/theme';
import { ITEM_INVENTORY_THUMBNAIL } from '@/features/inventory/constants';

type InventoryViewMode = 'list' | 'gallery';

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
  const { data: userTags } = useUserTags();

  const activeTags = useMemo(
    () => (userTags ? selectedTags.filter((tag) => userTags.includes(tag)) : selectedTags),
    [selectedTags, userTags],
  );

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
    if (activeTags.length > 0) {
      result = result.filter((item) => item.tags.some((tag) => activeTags.includes(tag)));
    }
    if (!showTerminal) {
      result = result.filter((item) => !isTerminalStatus(item.status));
    }
    return result;
  }, [items, selectedCategory, searchQuery, activeTags, showTerminal]);

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

  const handleAddPress = useCallback(() => {
    if (selectedCategory) {
      router.push(`/(tabs)/inventory/new?category=${selectedCategory}`);
    } else {
      router.push('/(tabs)/inventory/new');
    }
  }, [selectedCategory]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
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

  const viewModeButtons = useMemo(
    () => [
      {
        value: 'list' as const,
        icon: 'view-list',
        accessibilityLabel: t('viewMode.listA11y'),
        labelStyle: styles.viewModeSegmentHiddenLabel,
        style: styles.viewModeSegment,
      },
      {
        value: 'gallery' as const,
        icon: 'view-grid',
        accessibilityLabel: t('viewMode.galleryA11y'),
        labelStyle: styles.viewModeSegmentHiddenLabel,
        style: styles.viewModeSegment,
      },
    ],
    [t],
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
        <Button
          mode="text"
          compact
          onPress={() => router.push('/(tabs)/bikes')}
          accessibilityRole="link"
          accessibilityLabel={t('bikesLink')}
          style={styles.bikesLinkButton}
        >
          {t('bikesLink')}
        </Button>
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
                    styles.tagFilterChip,
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

      {!isLoading && filteredItems.length > 0 && (
        <View style={styles.viewModeRow}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as InventoryViewMode)}
            buttons={viewModeButtons}
            density="high"
            style={styles.viewModeSegments}
          />
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
          key={viewMode === 'gallery' ? `gallery-${galleryColumnCount}` : 'list'}
          style={styles.listContainer}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'gallery' ? galleryColumnCount : 1}
          columnWrapperStyle={viewMode === 'gallery' ? styles.galleryRow : undefined}
          extraData={viewMode}
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
  bikesLinkButton: {
    marginRight: -spacing.sm,
    flexShrink: 0,
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
  terminalChipRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  viewModeRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  viewModeSegments: {
    alignSelf: 'center',
  },
  viewModeSegment: {
    minWidth: 52,
    maxHeight: 36,
  },
  viewModeSegmentHiddenLabel: {
    fontSize: 0,
    lineHeight: 0,
    margin: 0,
    padding: 0,
    height: 0,
    opacity: 0,
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

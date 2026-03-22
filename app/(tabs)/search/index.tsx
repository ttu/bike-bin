import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Text, Chip, useTheme, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { EmptyState } from '@/shared/components';
import { usePrimaryLocation } from '@/features/locations';
import {
  SearchFiltersProvider,
  useSearchFilters,
  useSearchItems,
  SearchBar,
  SearchResultGridCard,
  FilterSheet,
} from '@/features/search';
import type { SearchResultItem, SearchSortOption } from '@/features/search';
import { AvailabilityType } from '@/shared/types';
import { useDemoMode, DemoBanner } from '@/features/demo';
import { DEMO_SEARCH_RESULTS } from '@/features/demo/data';

function SearchScreenContent() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const router = useRouter();
  const { filters, updateFilters, resetFilters, hasActiveFilters } = useSearchFilters();
  const { data: primaryLocation } = usePrimaryLocation();
  const { isDemoMode } = useDemoMode();

  const [hasSearched, setHasSearched] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const { data: serverResults, isLoading } = useSearchItems({
    filters,
    enabled: hasSearched && !isDemoMode,
  });

  // In demo mode, show results immediately to showcase the app
  const results = isDemoMode ? DEMO_SEARCH_RESULTS : serverResults;
  const effectiveHasSearched = isDemoMode || hasSearched;
  const effectiveIsLoading = isDemoMode ? false : isLoading;

  const handleSubmit = useCallback(() => {
    if (filters.query.trim().length > 0) {
      setHasSearched(true);
    }
  }, [filters.query]);

  const handleResultPress = useCallback(
    (item: SearchResultItem) => {
      router.push(`/(tabs)/search/${item.id}`);
    },
    [router],
  );

  const toggleQuickFilter = useCallback(
    (type: AvailabilityType) => {
      const current = filters.offerTypes;
      if (current.includes(type)) {
        updateFilters({ offerTypes: current.filter((t) => t !== type) });
      } else {
        updateFilters({ offerTypes: [...current, type] });
      }
    },
    [filters.offerTypes, updateFilters],
  );

  const sortLabel =
    filters.sortBy === 'newest'
      ? t('sort.newest')
      : filters.sortBy === 'recently_available'
        ? t('sort.recently_available')
        : t('sort.distance');

  const cycleSortBy = useCallback(() => {
    const order: SearchSortOption[] = ['distance', 'newest', 'recently_available'];
    const currentIndex = order.indexOf(filters.sortBy);
    const next = order[(currentIndex + 1) % order.length];
    updateFilters({ sortBy: next });
  }, [filters.sortBy, updateFilters]);

  const renderItem = useCallback(
    ({ item, index }: { item: SearchResultItem; index: number }) => (
      <Animated.View entering={FadeInUp.duration(300).delay(Math.min(index, 10) * 50)}>
        <SearchResultGridCard item={item} onPress={handleResultPress} isLeft={index % 2 === 0} />
      </Animated.View>
    ),
    [handleResultPress],
  );

  const showResults = effectiveHasSearched && !effectiveIsLoading && results && results.length > 0;
  const showEmpty = effectiveHasSearched && !effectiveIsLoading && results && results.length === 0;
  const showInitial = !effectiveHasSearched;

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Title */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('title')}
        </Text>
      </View>

      {/* Search bar */}
      <SearchBar
        query={filters.query}
        onQueryChange={(query) => updateFilters({ query })}
        onSubmit={handleSubmit}
        areaName={primaryLocation?.areaName}
        distanceKm={filters.maxDistanceKm}
        onDistanceChange={(km) => updateFilters({ maxDistanceKm: km })}
      />

      <DemoBanner />

      {/* Quick filter chips + Filters button */}
      {effectiveHasSearched && (
        <View style={styles.quickFilters}>
          <Chip
            selected={filters.offerTypes.includes(AvailabilityType.Borrowable)}
            onPress={() => toggleQuickFilter(AvailabilityType.Borrowable)}
            compact
            showSelectedCheck={false}
            textStyle={
              filters.offerTypes.includes(AvailabilityType.Borrowable)
                ? { color: theme.colors.onPrimary }
                : undefined
            }
            style={[
              styles.quickChip,
              {
                backgroundColor: filters.offerTypes.includes(AvailabilityType.Borrowable)
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t('quickFilter.borrow')}
          </Chip>
          <Chip
            selected={filters.offerTypes.includes(AvailabilityType.Donatable)}
            onPress={() => toggleQuickFilter(AvailabilityType.Donatable)}
            compact
            showSelectedCheck={false}
            textStyle={
              filters.offerTypes.includes(AvailabilityType.Donatable)
                ? { color: theme.colors.onPrimary }
                : undefined
            }
            style={[
              styles.quickChip,
              {
                backgroundColor: filters.offerTypes.includes(AvailabilityType.Donatable)
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t('quickFilter.donate')}
          </Chip>
          <Chip
            selected={filters.offerTypes.includes(AvailabilityType.Sellable)}
            onPress={() => toggleQuickFilter(AvailabilityType.Sellable)}
            compact
            showSelectedCheck={false}
            textStyle={
              filters.offerTypes.includes(AvailabilityType.Sellable)
                ? { color: theme.colors.onPrimary }
                : undefined
            }
            style={[
              styles.quickChip,
              {
                backgroundColor: filters.offerTypes.includes(AvailabilityType.Sellable)
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t('quickFilter.sell')}
          </Chip>
          <Chip
            icon={() => (
              <MaterialCommunityIcons
                name="filter-variant"
                size={16}
                color={hasActiveFilters ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              />
            )}
            onPress={() => setFilterVisible(true)}
            compact
            showSelectedCheck={false}
            textStyle={hasActiveFilters ? { color: theme.colors.onPrimary } : undefined}
            style={[
              styles.quickChip,
              {
                backgroundColor: hasActiveFilters
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t('filter.title')}
          </Chip>
        </View>
      )}

      {/* Result count + sort */}
      {showResults && (
        <View style={styles.resultHeader}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('results.count', {
              count: results.length,
              distance: filters.maxDistanceKm,
            })}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.primary }} onPress={cycleSortBy}>
            {sortLabel}
          </Text>
        </View>
      )}

      {/* Loading */}
      {effectiveHasSearched && effectiveIsLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {/* Results list */}
      {showResults && (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Empty results */}
      {showEmpty && (
        <EmptyState
          icon="magnify-close"
          title={t('noResults.title')}
          description={t('noResults.description')}
        />
      )}

      {/* Initial state */}
      {showInitial && (
        <EmptyState icon="magnify" title={t('empty.title')} description={t('empty.description')} />
      )}

      {/* Filter bottom sheet (modal) */}
      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={[styles.filterModal, { backgroundColor: theme.colors.surface }]}
        >
          <FilterSheet
            categories={filters.categories}
            onCategoriesChange={(categories) => updateFilters({ categories })}
            conditions={filters.conditions}
            onConditionsChange={(conditions) => updateFilters({ conditions })}
            offerTypes={filters.offerTypes}
            onOfferTypesChange={(offerTypes) => updateFilters({ offerTypes })}
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            onPriceMinChange={(priceMin) => updateFilters({ priceMin })}
            onPriceMaxChange={(priceMax) => updateFilters({ priceMax })}
            onReset={resetFilters}
            onApply={() => setFilterVisible(false)}
          />
        </Modal>
      </Portal>
    </View>
  );
}

export default function SearchScreen() {
  return (
    <SearchFiltersProvider>
      <SearchScreenContent />
    </SearchFiltersProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickChip: {
    height: 32,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 100,
    paddingHorizontal: spacing.base,
  },
  columnWrapper: {
    justifyContent: 'space-between' as const,
  },
  filterModal: {
    margin: spacing.base,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
});

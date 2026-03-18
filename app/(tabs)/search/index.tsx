import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Chip, useTheme, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  SearchResultCard,
  FilterSheet,
} from '@/features/search';
import type { SearchResultItem, SearchSortOption } from '@/features/search';
import { AvailabilityType } from '@/shared/types';

function SearchScreenContent() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const router = useRouter();
  const { filters, updateFilters, resetFilters, hasActiveFilters } = useSearchFilters();
  const { data: primaryLocation } = usePrimaryLocation();

  const [hasSearched, setHasSearched] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const { data: results, isLoading } = useSearchItems({
    filters,
    enabled: hasSearched,
  });

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
    ({ item }: { item: SearchResultItem }) => (
      <SearchResultCard item={item} onPress={handleResultPress} />
    ),
    [handleResultPress],
  );

  const showResults = hasSearched && !isLoading && results && results.length > 0;
  const showEmpty = hasSearched && !isLoading && results && results.length === 0;
  const showInitial = !hasSearched;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Search bar */}
      <SearchBar
        query={filters.query}
        onQueryChange={(query) => updateFilters({ query })}
        onSubmit={handleSubmit}
        areaName={primaryLocation?.areaName}
        distanceKm={filters.maxDistanceKm}
        onDistanceChange={(km) => updateFilters({ maxDistanceKm: km })}
      />

      {/* Quick filter chips + Filters button */}
      {hasSearched && (
        <View style={styles.quickFilters}>
          <Chip
            selected={filters.offerTypes.includes(AvailabilityType.Borrowable)}
            onPress={() => toggleQuickFilter(AvailabilityType.Borrowable)}
            compact
            style={[
              styles.quickChip,
              filters.offerTypes.includes(AvailabilityType.Borrowable) && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
          >
            {t('quickFilter.borrow')}
          </Chip>
          <Chip
            selected={filters.offerTypes.includes(AvailabilityType.Donatable)}
            onPress={() => toggleQuickFilter(AvailabilityType.Donatable)}
            compact
            style={[
              styles.quickChip,
              filters.offerTypes.includes(AvailabilityType.Donatable) && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
          >
            {t('quickFilter.donate')}
          </Chip>
          <Chip
            selected={filters.offerTypes.includes(AvailabilityType.Sellable)}
            onPress={() => toggleQuickFilter(AvailabilityType.Sellable)}
            compact
            style={[
              styles.quickChip,
              filters.offerTypes.includes(AvailabilityType.Sellable) && {
                backgroundColor: theme.colors.primaryContainer,
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
                color={theme.colors.onSurfaceVariant}
              />
            )}
            onPress={() => setFilterVisible(true)}
            compact
            style={[
              styles.quickChip,
              hasActiveFilters && { backgroundColor: theme.colors.primaryContainer },
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
      {hasSearched && isLoading && (
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
    </SafeAreaView>
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
    paddingBottom: spacing['2xl'],
  },
  filterModal: {
    margin: spacing.base,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
});

import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Chip, useTheme, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
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
import { useAuth } from '@/features/auth';
import { useDemoMode, DemoBanner } from '@/features/demo';
import { DEMO_SEARCH_RESULTS } from '@/features/demo/data';

function SearchScreenContent() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const router = useRouter();
  const { filters, updateFilters, resetFilters, hasActiveFilters, hasSearched, setHasSearched } =
    useSearchFilters();
  const { data: primaryLocation } = usePrimaryLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDemoMode } = useDemoMode();

  const showGuestWall = !isDemoMode && !authLoading && !isAuthenticated;
  const showAuthSpinner = !isDemoMode && authLoading;

  const [filterVisible, setFilterVisible] = useState(false);

  const { data: serverResults, isLoading } = useSearchItems({
    filters,
    enabled: hasSearched && !isDemoMode && isAuthenticated,
  });

  // In demo mode, show results immediately to showcase the app
  const results = isDemoMode ? DEMO_SEARCH_RESULTS : serverResults;
  const effectiveHasSearched = isDemoMode || hasSearched;
  const effectiveIsLoading = isDemoMode ? false : isLoading;

  const handleQueryChange = useCallback(
    (query: string) => {
      updateFilters({ query });
      if (query.trim().length === 0) {
        setHasSearched(false);
      }
    },
    [updateFilters, setHasSearched],
  );

  const handleSubmit = useCallback(() => {
    if (filters.query.trim().length > 0) {
      setHasSearched(true);
    }
  }, [filters.query, setHasSearched]);

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
      <SearchResultGridCard item={item} onPress={handleResultPress} />
    ),
    [handleResultPress],
  );

  const showResults = effectiveHasSearched && !effectiveIsLoading && results && results.length > 0;
  const showEmpty = effectiveHasSearched && !effectiveIsLoading && results && results.length === 0;
  const showInitial = !effectiveHasSearched;

  const listData = showResults && results ? results : [];

  const listHeader = useMemo(
    () => (
      <>
        <DemoBanner />

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

        {showResults && results && (
          <View style={styles.resultHeader}>
            <Text
              variant="bodySmall"
              style={[styles.resultCount, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('results.count', {
                count: results.length,
                distance: filters.maxDistanceKm,
              })}
            </Text>
            <Text
              variant="labelSmall"
              style={[styles.sortControl, { color: theme.colors.primary }]}
              onPress={cycleSortBy}
            >
              {sortLabel}
            </Text>
          </View>
        )}
      </>
    ),
    [
      effectiveHasSearched,
      filters.maxDistanceKm,
      filters.offerTypes,
      hasActiveFilters,
      cycleSortBy,
      results,
      showResults,
      sortLabel,
      t,
      theme.colors,
      toggleQuickFilter,
    ],
  );

  const listEmpty = useMemo(() => {
    if (effectiveHasSearched && effectiveIsLoading) {
      return <CenteredLoadingIndicator fill={false} />;
    }
    if (showEmpty) {
      return (
        <EmptyState
          icon="magnify-close"
          title={t('noResults.title')}
          description={t('noResults.description')}
        />
      );
    }
    if (showInitial) {
      return (
        <EmptyState icon="magnify" title={t('empty.title')} description={t('empty.description')} />
      );
    }
    return null;
  }, [effectiveHasSearched, effectiveIsLoading, showEmpty, showInitial, t]);

  const listContentContainerStyle = useMemo(
    () => [
      styles.list,
      (showEmpty || showInitial || (effectiveHasSearched && effectiveIsLoading)) &&
        styles.listContentGrow,
    ],
    [showEmpty, showInitial, effectiveHasSearched, effectiveIsLoading],
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('title')}
        </Text>
      </View>

      {showAuthSpinner && <CenteredLoadingIndicator />}

      {showGuestWall && (
        <EmptyState
          icon="account-lock-outline"
          title={t('authRequired.title')}
          description={t('authRequired.description')}
          ctaLabel={t('authRequired.signIn')}
          onCtaPress={() => router.push('/(auth)/login')}
        />
      )}

      {!showAuthSpinner && !showGuestWall && (
        <>
          <SearchBar
            query={filters.query}
            onQueryChange={handleQueryChange}
            onSubmit={handleSubmit}
            areaName={primaryLocation?.areaName}
            distanceKm={filters.maxDistanceKm}
            onDistanceChange={(km) => updateFilters({ maxDistanceKm: km })}
          />

          <FlatList
            style={styles.resultsList}
            data={listData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            contentContainerStyle={listContentContainerStyle}
          />

          <Portal>
            <Modal
              visible={filterVisible}
              onDismiss={() => setFilterVisible(false)}
              contentContainerStyle={[
                styles.filterModal,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <FilterSheet
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
                onApply={() => setFilterVisible(false)}
              />
            </Modal>
          </Portal>
        </>
      )}
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
  resultsList: {
    flex: 1,
  },
  listContentGrow: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickChip: {
    height: 32,
  },
  resultHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  resultCount: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  sortControl: {
    flexShrink: 0,
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

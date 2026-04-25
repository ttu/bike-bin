import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Chip, useTheme, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, tabBarListScrollPaddingBottom } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { ScreenMasthead } from '@/shared/components/ScreenMasthead';
import { Stamp } from '@/shared/components/Stamp';
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
import { groupSearchResultPairs } from '@/features/search/utils/groupSearchResultPairs';
import {
  getSearchResultGridWideCardWidth,
  getSearchResultGridNarrowCardWidth,
  getSearchResultGridHeroCardWidth,
  SEARCH_GRID_COLUMN_GAP,
} from '@/features/search/utils/searchGridDimensions';
import type { SearchResultPair } from '@/features/search/utils/groupSearchResultPairs';

function SearchScreenContent() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
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

  const showResults = effectiveHasSearched && !effectiveIsLoading && results && results.length > 0;
  const showEmpty = effectiveHasSearched && !effectiveIsLoading && results && results.length === 0;
  const showInitial = !effectiveHasSearched;

  // Separate hero item and remaining items for the asymmetric editorial grid
  const heroItem = showResults && results ? results[0] : undefined;
  const resultPairs = useMemo(
    () => groupSearchResultPairs(showResults && results ? results.slice(1) : []),
    [showResults, results],
  );

  const heroCardWidth = getSearchResultGridHeroCardWidth(windowWidth);
  const wideWidth = getSearchResultGridWideCardWidth(windowWidth);
  const narrowWidth = getSearchResultGridNarrowCardWidth(windowWidth);

  const renderPairItem = useCallback(
    (info: { item: SearchResultPair<SearchResultItem> }) => {
      const { item } = info;
      const [first, second] = item.items;
      const firstVariant = item.type === 'wide-narrow' ? 'wide' : 'narrow';
      const secondVariant = item.type === 'wide-narrow' ? 'narrow' : 'wide';
      const firstWidth = item.type === 'wide-narrow' ? wideWidth : narrowWidth;
      const secondWidth = item.type === 'wide-narrow' ? narrowWidth : wideWidth;

      return (
        <View style={[styles.pairRow, styles.pairRowGap]}>
          <SearchResultGridCard
            item={first}
            onPress={handleResultPress}
            variant={firstVariant}
            cardWidth={firstWidth}
          />
          {second ? (
            <SearchResultGridCard
              item={second}
              onPress={handleResultPress}
              variant={secondVariant}
              cardWidth={secondWidth}
            />
          ) : null}
        </View>
      );
    },
    [handleResultPress, wideWidth, narrowWidth],
  );

  const listHeader = useMemo(
    () => (
      <>
        <DemoBanner />

        {effectiveHasSearched && (
          <View style={styles.quickFilters}>
            {[
              { type: AvailabilityType.Borrowable, label: t('quickFilter.borrow') },
              { type: AvailabilityType.Donatable, label: t('quickFilter.donate') },
              { type: AvailabilityType.Sellable, label: t('quickFilter.sell') },
            ].map(({ type, label }) => {
              const active = filters.offerTypes.includes(type);
              return (
                <Chip
                  key={type}
                  selected={active}
                  onPress={() => toggleQuickFilter(type)}
                  compact
                  showSelectedCheck={false}
                  textStyle={{
                    color: active ? theme.colors.surface : theme.colors.onSurfaceVariant,
                  }}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: active
                        ? theme.colors.onBackground
                        : theme.customColors.surfaceContainerHigh,
                    },
                  ]}
                >
                  {label}
                </Chip>
              );
            })}
            <Chip
              icon={() => (
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={16}
                  color={hasActiveFilters ? theme.colors.surface : theme.colors.onSurfaceVariant}
                />
              )}
              onPress={() => setFilterVisible(true)}
              compact
              showSelectedCheck={false}
              textStyle={{
                color: hasActiveFilters ? theme.colors.surface : theme.colors.onSurfaceVariant,
              }}
              style={[
                styles.quickChip,
                {
                  backgroundColor: hasActiveFilters
                    ? theme.colors.onBackground
                    : theme.customColors.surfaceContainerHigh,
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

        {heroItem && (
          <View style={styles.heroRow}>
            <SearchResultGridCard
              item={heroItem}
              onPress={handleResultPress}
              variant="hero"
              cardWidth={heroCardWidth}
            />
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
      theme.customColors,
      toggleQuickFilter,
      heroItem,
      handleResultPress,
      heroCardWidth,
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
      <ScreenMasthead eyebrow={t('masthead.eyebrow')} title={t('masthead.title')} />
      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.tertiary} />
        <Text variant="bodySmall" style={{ color: theme.colors.onBackground }}>
          {primaryLocation?.areaName ?? t('masthead.locationUnknown')}
        </Text>
        <Stamp tone="dim">{t('masthead.radius', { km: filters.maxDistanceKm })}</Stamp>
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
            data={resultPairs}
            renderItem={renderPairItem}
            keyExtractor={(pair) => pair.items.map((i) => i.id).join('-')}
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
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
    height: 28,
    borderRadius: borderRadius.sm,
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
    paddingBottom: tabBarListScrollPaddingBottom,
    paddingHorizontal: spacing.base,
  },
  heroRow: {
    marginBottom: SEARCH_GRID_COLUMN_GAP,
  },
  pairRow: {
    flexDirection: 'row',
  },
  pairRowGap: {
    gap: SEARCH_GRID_COLUMN_GAP,
  },
  filterModal: {
    margin: spacing.base,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
});

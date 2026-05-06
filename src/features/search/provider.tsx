import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { DEFAULT_SEARCH_FILTERS, type SearchFilters } from './types';
import { SearchFiltersContext } from './context';

interface SearchFiltersProviderProps {
  readonly children: ReactNode;
}

export function SearchFiltersProvider({ children }: SearchFiltersProviderProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [hasSearched, setHasSearched] = useState(false);

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...DEFAULT_SEARCH_FILTERS,
      query: prev.query,
    }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.conditions.length > 0 ||
      filters.offerTypes.length > 0 ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined ||
      filters.groupId !== undefined ||
      filters.maxDistanceKm !== DEFAULT_SEARCH_FILTERS.maxDistanceKm ||
      filters.sortBy !== DEFAULT_SEARCH_FILTERS.sortBy
    );
  }, [filters]);

  const value = useMemo(
    () => ({
      filters,
      updateFilters,
      resetFilters,
      hasActiveFilters,
      hasSearched,
      setHasSearched,
    }),
    [filters, updateFilters, resetFilters, hasActiveFilters, hasSearched],
  );

  return <SearchFiltersContext.Provider value={value}>{children}</SearchFiltersContext.Provider>;
}

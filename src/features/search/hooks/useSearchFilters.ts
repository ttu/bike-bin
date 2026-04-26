import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { DEFAULT_SEARCH_FILTERS, type SearchFilters } from '../types';

interface SearchFiltersContextType {
  filters: SearchFilters;
  updateFilters: (partial: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  /** True if any filter deviates from defaults (excluding query). */
  hasActiveFilters: boolean;
  /**
   * True after the user has submitted a non-empty search. Kept in context so the
   * search tab can remount (e.g. tab navigation) without losing the results view.
   */
  hasSearched: boolean;
  setHasSearched: (value: boolean) => void;
}

const SearchFiltersContext = createContext<SearchFiltersContextType | undefined>(undefined);

interface SearchFiltersProviderProps {
  children: React.ReactNode;
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

  return React.createElement(SearchFiltersContext.Provider, { value }, children);
}

export function useSearchFilters(): SearchFiltersContextType {
  const ctx = useContext(SearchFiltersContext);
  if (ctx === undefined) {
    throw new Error('useSearchFilters must be used within a SearchFiltersProvider');
  }
  return ctx;
}

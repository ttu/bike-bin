import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SearchFilters } from '../types';
import { DEFAULT_SEARCH_FILTERS } from '../types';

interface SearchFiltersContextType {
  filters: SearchFilters;
  updateFilters: (partial: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  /** True if any filter deviates from defaults (excluding query). */
  hasActiveFilters: boolean;
}

const SearchFiltersContext = createContext<SearchFiltersContextType | undefined>(undefined);

interface SearchFiltersProviderProps {
  children: React.ReactNode;
}

export function SearchFiltersProvider({ children }: SearchFiltersProviderProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);

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
    () => ({ filters, updateFilters, resetFilters, hasActiveFilters }),
    [filters, updateFilters, resetFilters, hasActiveFilters],
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

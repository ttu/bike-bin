import { createContext } from 'react';
import type { SearchFilters } from './types';

export interface SearchFiltersContextType {
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

export const SearchFiltersContext = createContext<SearchFiltersContextType | undefined>(undefined);

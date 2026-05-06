import { useContext } from 'react';
import { SearchFiltersContext, type SearchFiltersContextType } from '../context';

export function useSearchFilters(): SearchFiltersContextType {
  const ctx = useContext(SearchFiltersContext);
  if (ctx === undefined) {
    throw new Error('useSearchFilters must be used within a SearchFiltersProvider');
  }
  return ctx;
}

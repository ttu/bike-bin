import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { SearchFiltersProvider, useSearchFilters } from '../useSearchFilters';

function Wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(SearchFiltersProvider, null, children);
}

describe('useSearchFilters', () => {
  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useSearchFilters());
    }).toThrow('useSearchFilters must be used within a SearchFiltersProvider');
  });

  it('returns default filters', () => {
    const { result } = renderHook(() => useSearchFilters(), { wrapper: Wrapper });
    expect(result.current.filters.categories).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.hasSearched).toBe(false);
  });

  it('updates hasSearched via setHasSearched', () => {
    const { result } = renderHook(() => useSearchFilters(), { wrapper: Wrapper });

    act(() => {
      result.current.setHasSearched(true);
    });

    expect(result.current.hasSearched).toBe(true);
  });

  it('updates filters partially', () => {
    const { result } = renderHook(() => useSearchFilters(), { wrapper: Wrapper });

    act(() => {
      result.current.updateFilters({ categories: ['component'] });
    });

    expect(result.current.filters.categories).toEqual(['component']);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('resets filters but keeps query', () => {
    const { result } = renderHook(() => useSearchFilters(), { wrapper: Wrapper });

    act(() => {
      result.current.updateFilters({ query: 'pedals', categories: ['component'] });
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.query).toBe('pedals');
    expect(result.current.filters.categories).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

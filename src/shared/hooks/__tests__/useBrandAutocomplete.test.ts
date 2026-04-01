import { renderHook, act } from '@testing-library/react-native';
import { useState } from 'react';
import { useBrandAutocomplete } from '../useBrandAutocomplete';

const TEST_BRANDS = ['Campagnolo', 'Trek', 'Other'] as const;

function renderBrandAutocompleteHook(initialBrand = '') {
  return renderHook(() => {
    const [brand, setBrand] = useState(initialBrand);
    const autocomplete = useBrandAutocomplete({
      brand,
      setBrand,
      brands: TEST_BRANDS,
    });
    return { brand, setBrand, ...autocomplete };
  });
}

describe('useBrandAutocomplete', () => {
  it('filters suggestions by current brand text', () => {
    const { result } = renderBrandAutocompleteHook();

    act(() => {
      result.current.handleBrandInputChange('camp');
    });

    expect(result.current.brand).toBe('camp');
    expect(result.current.brandMenuVisible).toBe(true);
    expect(result.current.filteredBrands).toContain('Campagnolo');
    expect(result.current.filteredBrands.every((b) => b.toLowerCase().includes('camp'))).toBe(true);
  });

  it('hides menu when brand is cleared', () => {
    const { result } = renderBrandAutocompleteHook();

    act(() => {
      result.current.handleBrandInputChange('x');
    });
    expect(result.current.brandMenuVisible).toBe(true);

    act(() => {
      result.current.handleBrandInputChange('');
    });
    expect(result.current.brandMenuVisible).toBe(false);
  });

  it('sets brand and closes menu on select', () => {
    const { result } = renderBrandAutocompleteHook();

    act(() => {
      result.current.handleBrandSelect('Trek');
    });

    expect(result.current.brand).toBe('Trek');
    expect(result.current.brandMenuVisible).toBe(false);
  });

  it('opens suggestions on focus when brand text is non-empty', () => {
    const { result } = renderBrandAutocompleteHook('T');

    act(() => {
      result.current.handleBrandFocus();
    });

    expect(result.current.brandMenuVisible).toBe(true);
    expect(result.current.filteredBrands.length).toBeGreaterThan(0);
  });
});

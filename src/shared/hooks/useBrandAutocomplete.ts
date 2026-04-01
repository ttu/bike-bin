import { useState, useMemo, useCallback } from 'react';

export interface UseBrandAutocompleteParams {
  brand: string;
  setBrand: (value: string) => void;
  /** Suggestion source (e.g. inventory `DEFAULT_BRANDS` or bikes `DEFAULT_BIKE_BRANDS`). */
  brands: readonly string[];
}

export function useBrandAutocomplete({ brand, setBrand, brands }: UseBrandAutocompleteParams) {
  const [brandMenuVisible, setBrandMenuVisible] = useState(false);

  const filteredBrands = useMemo(() => {
    const search = brand.toLowerCase();
    if (!search) return [...brands];
    return brands.filter((b) => b.toLowerCase().includes(search));
  }, [brand, brands]);

  const handleBrandSelect = useCallback(
    (selectedBrand: string) => {
      setBrand(selectedBrand);
      setBrandMenuVisible(false);
    },
    [setBrand],
  );

  const handleBrandInputChange = useCallback(
    (text: string) => {
      setBrand(text);
      if (text.length > 0) {
        setBrandMenuVisible(true);
      } else {
        setBrandMenuVisible(false);
      }
    },
    [setBrand],
  );

  const handleBrandFocus = useCallback(() => {
    if (brand.length > 0) setBrandMenuVisible(true);
  }, [brand]);

  const handleBrandBlur = useCallback(() => {
    setTimeout(() => setBrandMenuVisible(false), 200);
  }, []);

  return {
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
  };
}

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

export interface UseBrandAutocompleteParams {
  brand: string;
  setBrand: (value: string) => void;
  /** Suggestion source (e.g. inventory `DEFAULT_BRANDS` or bikes `DEFAULT_BIKE_BRANDS`). */
  brands: readonly string[];
}

export function useBrandAutocomplete({ brand, setBrand, brands }: UseBrandAutocompleteParams) {
  const [brandMenuVisible, setBrandMenuVisible] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelBlurTimeout(), [cancelBlurTimeout]);

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
    cancelBlurTimeout();
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      setBrandMenuVisible(false);
    }, 200);
  }, [cancelBlurTimeout]);

  return {
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
    cancelBlurTimeout,
  };
}

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AvailabilityType,
  ItemCategory,
  type GroupId,
  type ItemCondition,
  type Visibility,
} from '@/shared/types';

import { validateItem, type ItemFormData } from '../../utils/validation';
import { buildItemFormDataFromState } from '../../utils/buildItemFormDataFromState';
import { areItemFormDataEqual } from '../../utils/itemFormDataEquality';
import { resolveFormName } from '@/shared/utils';
import { useUserTags } from '../../hooks/useUserTags';
import { useItems } from '../../hooks/useItems';
import { SUBCATEGORIES, DEFAULT_BRANDS } from '../../constants';
import { useDistanceUnit } from '@/features/profile';
import { useBrandAutocomplete } from '@/shared/hooks/useBrandAutocomplete';
import { collectFormErrorMessages } from '@/shared/utils/formValidationFeedback';
import type { DistanceUnit } from '@/shared/types';

import {
  itemFormReducer,
  makeInitialItemFormState,
  type ItemFormReducerState,
} from './itemFormReducer';
import type { ItemFormState } from './types';

interface UseItemFormStateParams {
  initialData?: ItemFormData;
  initialCategory?: ItemCategory;
  onSave: (data: ItemFormData) => void;
  onValidationError?: (messages: string[]) => void;
}

export function useItemFormState({
  initialData,
  initialCategory,
  onSave,
  onValidationError,
}: UseItemFormStateParams): ItemFormState {
  const { t } = useTranslation('inventory');
  const { data: existingItems } = useItems();
  const { distanceUnit } = useDistanceUnit();

  const [state, dispatch] = useReducer(
    itemFormReducer,
    { initialData, initialCategory, distanceUnit },
    makeInitialItemFormState,
  );

  const { basic, availability, visibility: vis, optional, tags, errors } = state;

  // Setters wrap dispatch.
  const setName = useCallback((value: string) => dispatch({ type: 'setName', value }), []);
  const setQuantityStr = useCallback(
    (value: string) => dispatch({ type: 'setQuantityStr', value }),
    [],
  );
  const setSubcategory = useCallback(
    (value: string) => dispatch({ type: 'setSubcategory', value }),
    [],
  );
  const setCondition = useCallback(
    (value: ItemCondition) => dispatch({ type: 'setCondition', value }),
    [],
  );
  const setBrand = useCallback((value: string) => dispatch({ type: 'setBrand', value }), []);
  const setModel = useCallback((value: string) => dispatch({ type: 'setModel', value }), []);
  const toggleAvailability = useCallback(
    (value: AvailabilityType) => dispatch({ type: 'toggleAvailability', value }),
    [],
  );
  const setPrice = useCallback((value: string) => dispatch({ type: 'setPrice', value }), []);
  const setDeposit = useCallback((value: string) => dispatch({ type: 'setDeposit', value }), []);
  const setBorrowDuration = useCallback(
    (value: string) => dispatch({ type: 'setBorrowDuration', value }),
    [],
  );
  const setDurationMenuVisible = useCallback(
    (value: boolean) => dispatch({ type: 'setDurationMenuVisible', value }),
    [],
  );
  const setVisibility = useCallback(
    (value: Visibility) => dispatch({ type: 'setVisibility', value }),
    [],
  );
  const toggleGroupId = useCallback(
    (value: GroupId) => dispatch({ type: 'toggleGroup', value }),
    [],
  );
  const setShowOptional = useCallback(
    (value: boolean) => dispatch({ type: 'setShowOptional', value }),
    [],
  );
  const setPurchaseDate = useCallback(
    (value: string) => dispatch({ type: 'setPurchaseDate', value }),
    [],
  );
  const setMountedDate = useCallback(
    (value: string) => dispatch({ type: 'setMountedDate', value }),
    [],
  );
  const setAge = useCallback((value: string) => dispatch({ type: 'setAge', value }), []);
  const setAgeMenuVisible = useCallback(
    (value: boolean) => dispatch({ type: 'setAgeMenuVisible', value }),
    [],
  );
  const setUsage = useCallback((value: string) => dispatch({ type: 'setUsage', value }), []);
  const setStorageLocation = useCallback(
    (value: string) => dispatch({ type: 'setStorageLocation', value }),
    [],
  );
  const setStorageMenuVisible = useCallback(
    (value: boolean) => dispatch({ type: 'setStorageMenuVisible', value }),
    [],
  );
  const setDescription = useCallback(
    (value: string) => dispatch({ type: 'setDescription', value }),
    [],
  );
  const setRemainingPercentStr = useCallback(
    (value: string) => dispatch({ type: 'setRemainingPercentStr', value }),
    [],
  );
  const setTagInput = useCallback((value: string) => dispatch({ type: 'setTagInput', value }), []);
  const setTagSuggestionsVisible = useCallback(
    (value: boolean) => dispatch({ type: 'setTagSuggestionsVisible', value }),
    [],
  );

  const {
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
    cancelBlurTimeout: cancelBrandBlurTimeout,
  } = useBrandAutocomplete({ brand: basic.brand, setBrand, brands: DEFAULT_BRANDS });

  const tagBlurCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTagBlurCommitTimeout = useCallback(() => {
    if (tagBlurCommitTimeoutRef.current !== undefined) {
      clearTimeout(tagBlurCommitTimeoutRef.current);
      tagBlurCommitTimeoutRef.current = undefined;
    }
  }, []);
  useEffect(() => () => clearTagBlurCommitTimeout(), [clearTagBlurCommitTimeout]);

  const handleAddTag = useCallback(
    (rawInput: string) => {
      clearTagBlurCommitTimeout();
      dispatch({ type: 'addTag', value: rawInput });
    },
    [clearTagBlurCommitTimeout],
  );

  const handleRemoveTag = useCallback(
    (value: string) => dispatch({ type: 'removeTag', value }),
    [],
  );

  const { data: userTags } = useUserTags();

  const existingStorageLocations = useMemo(() => {
    if (!existingItems) return [];
    const locations = existingItems
      .map((item) => item.storageLocation)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locations)].sort((a, b) => a.localeCompare(b));
  }, [existingItems]);

  const currentSubcategories = useMemo(() => {
    if (!basic.category) return [];
    return SUBCATEGORIES[basic.category] ?? [];
  }, [basic.category]);

  const isSellable = availability.types.includes(AvailabilityType.Sellable);
  const isBorrowable = availability.types.includes(AvailabilityType.Borrowable);

  const nameFieldValue = useMemo(
    () => (basic.name.trim() === '' ? resolveFormName('', basic.brand, basic.model) : basic.name),
    [basic.name, basic.brand, basic.model],
  );

  const filteredTagSuggestions = useMemo(() => {
    if (!userTags || !tags.input.trim()) return [];
    const q = tags.input.toLowerCase();
    return userTags.filter(
      (tag) =>
        tag.toLowerCase().includes(q) &&
        !tags.list.some((existing) => existing.toLowerCase() === tag.toLowerCase()),
    );
  }, [userTags, tags.input, tags.list]);

  const handleCategoryChange = useCallback(
    (value: ItemCategory) => dispatch({ type: 'changeCategory', value }),
    [],
  );

  const draftFormData: ItemFormData = useMemo(
    () => buildDraft(state, distanceUnit, initialData?.pickupLocationId),
    [state, distanceUnit, initialData?.pickupLocationId],
  );

  const isDirty = useMemo(() => {
    if (!initialData) return true;
    return !areItemFormDataEqual(initialData, draftFormData);
  }, [initialData, draftFormData]);

  const handleSubmit = useCallback(() => {
    clearTagBlurCommitTimeout();
    // Commit any pending tag into UI state regardless of validation outcome, so what the user
    // sees matches what was validated/submitted (`draftFormData` already merges the pending tag
    // into its tags array via buildItemFormDataFromState).
    dispatch({ type: 'commitPendingTagAndSubmit' });

    const validationErrors = validateItem(draftFormData, t);
    dispatch({ type: 'setErrors', value: validationErrors });

    if (Object.keys(validationErrors).length > 0) {
      const messages = collectFormErrorMessages(validationErrors);
      if (messages.length > 0) {
        onValidationError?.(messages);
      }
      return;
    }

    onSave(draftFormData);
  }, [draftFormData, clearTagBlurCommitTimeout, onSave, onValidationError, t]);

  return {
    name: basic.name,
    nameFieldValue,
    setName,
    quantityStr: basic.quantityStr,
    setQuantityStr,
    category: basic.category,
    subcategory: basic.subcategory,
    setSubcategory,
    condition: basic.condition,
    setCondition,
    brand: basic.brand,
    brandMenuVisible,
    handleBrandFocus,
    handleBrandBlur,
    cancelBrandBlurTimeout,
    filteredBrands,
    model: basic.model,
    setModel,
    handleBrandSelect,
    handleBrandInputChange,
    availabilityTypes: availability.types,
    toggleAvailability,
    isSellable,
    isBorrowable,
    price: availability.price,
    setPrice,
    deposit: availability.deposit,
    setDeposit,
    borrowDuration: availability.borrowDuration,
    setBorrowDuration,
    durationMenuVisible: availability.durationMenuVisible,
    setDurationMenuVisible,
    visibility: vis.visibility,
    setVisibility,
    groupIds: vis.groupIds,
    toggleGroupId,
    handleCategoryChange,
    currentSubcategories,
    remainingPercentStr: optional.remainingPercentStr,
    setRemainingPercentStr,
    purchaseDate: optional.purchaseDate,
    setPurchaseDate,
    mountedDate: optional.mountedDate,
    setMountedDate,
    age: optional.age,
    setAge,
    ageMenuVisible: optional.ageMenuVisible,
    setAgeMenuVisible,
    usage: optional.usage,
    setUsage,
    distanceUnit,
    storageLocation: optional.storageLocation,
    setStorageLocation,
    storageMenuVisible: optional.storageMenuVisible,
    setStorageMenuVisible,
    existingStorageLocations,
    description: optional.description,
    setDescription,
    tags: tags.list,
    tagInput: tags.input,
    setTagInput,
    tagSuggestionsVisible: tags.suggestionsVisible,
    setTagSuggestionsVisible,
    filteredTagSuggestions,
    handleAddTag,
    handleRemoveTag,
    clearTagBlurCommitTimeout,
    tagBlurCommitTimeoutRef,
    showOptional: optional.showOptional,
    setShowOptional,
    errors,
    handleSubmit,
    isDirty,
  };
}

function buildDraft(
  state: ItemFormReducerState,
  distanceUnit: DistanceUnit,
  pickupLocationId: ItemFormData['pickupLocationId'],
): ItemFormData {
  return buildItemFormDataFromState({
    name: state.basic.name,
    quantityStr: state.basic.quantityStr,
    category: state.basic.category,
    subcategory: state.basic.subcategory,
    condition: state.basic.condition,
    brand: state.basic.brand,
    model: state.basic.model,
    description: state.optional.description,
    availabilityTypes: state.availability.types,
    price: state.availability.price,
    deposit: state.availability.deposit,
    borrowDuration: state.availability.borrowDuration,
    storageLocation: state.optional.storageLocation,
    age: state.optional.age,
    usage: state.optional.usage,
    remainingPercentStr: state.optional.remainingPercentStr,
    purchaseDate: state.optional.purchaseDate,
    mountedDate: state.optional.mountedDate,
    visibility: state.visibility.visibility,
    groupIds: state.visibility.groupIds,
    tags: state.tags.list,
    tagInput: state.tags.input,
    distanceUnit,
    pickupLocationId,
  });
}

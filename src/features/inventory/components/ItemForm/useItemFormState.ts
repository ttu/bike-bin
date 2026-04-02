import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ItemCategory, ItemCondition, AvailabilityType, Visibility } from '@/shared/types';
import type { GroupId } from '@/shared/types';

import { validateItem } from '../../utils/validation';
import type { ItemFormData, ItemFormErrors } from '../../utils/validation';
import {
  formatRemainingPercentField,
  parseRemainingPercentInput,
} from '../../utils/remainingFractionInput';
import { useUserTags } from '../../hooks/useUserTags';
import { canAddTag, sanitizeTag } from '../../utils/tagUtils';
import { useItems } from '../../hooks/useItems';
import { SUBCATEGORIES, DEFAULT_BRANDS } from '../../constants';
import { useDistanceUnit } from '@/features/profile';
import { useBrandAutocomplete } from '@/shared/hooks/useBrandAutocomplete';

import type { ItemFormState } from './types';

interface UseItemFormStateParams {
  initialData?: ItemFormData;
  initialCategory?: ItemCategory;
  onSave: (data: ItemFormData) => void;
}

export function useItemFormState({
  initialData,
  initialCategory,
  onSave,
}: UseItemFormStateParams): ItemFormState {
  const { t } = useTranslation('inventory');
  const { data: existingItems } = useItems();

  // ── Core fields ──────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? '');
  const [quantityStr, setQuantityStr] = useState(() => String(initialData?.quantity ?? 1));
  const [category, setCategory] = useState<ItemCategory | undefined>(
    initialData?.category ?? initialCategory,
  );
  const [subcategory, setSubcategory] = useState(initialData?.subcategory ?? '');
  const [condition, setCondition] = useState<ItemCondition | undefined>(initialData?.condition);
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const [model, setModel] = useState(initialData?.model ?? '');
  const {
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
  } = useBrandAutocomplete({ brand, setBrand, brands: DEFAULT_BRANDS });

  // ── Availability ─────────────────────────────────────────────
  const [availabilityTypes, setAvailabilityTypes] = useState<AvailabilityType[]>(() => {
    if (initialData?.availabilityTypes !== undefined) {
      return initialData.availabilityTypes;
    }
    return [AvailabilityType.Private];
  });
  const [price, setPrice] = useState(initialData?.price?.toString() ?? '');
  const [deposit, setDeposit] = useState(initialData?.deposit?.toString() ?? '');
  const [borrowDuration, setBorrowDuration] = useState(initialData?.borrowDuration ?? '');
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);

  // ── Visibility ───────────────────────────────────────────────
  const [visibility, setVisibility] = useState<Visibility>(
    initialData?.visibility ?? Visibility.Private,
  );
  const [groupIds, setGroupIds] = useState<GroupId[]>(initialData?.groupIds ?? []);

  // ── Optional fields ──────────────────────────────────────────
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [storageLocation, setStorageLocation] = useState(initialData?.storageLocation ?? '');
  const [storageMenuVisible, setStorageMenuVisible] = useState(false);
  const [age, setAge] = useState(initialData?.age ?? '');
  const [ageMenuVisible, setAgeMenuVisible] = useState(false);
  const [usage, setUsage] = useState(initialData?.usage?.toString() ?? '');
  const [remainingPercentStr, setRemainingPercentStr] = useState(() =>
    formatRemainingPercentField(initialData?.remainingFraction),
  );
  const { distanceUnit } = useDistanceUnit();
  const [showOptional, setShowOptional] = useState(false);

  // ── Tags ─────────────────────────────────────────────────────
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const tagBlurCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tagSuggestionsVisible, setTagSuggestionsVisible] = useState(false);
  const { data: userTags } = useUserTags();

  // ── Errors ───────────────────────────────────────────────────
  const [errors, setErrors] = useState<ItemFormErrors>({});

  // ── Derived values ───────────────────────────────────────────
  const existingStorageLocations = useMemo(() => {
    if (!existingItems) return [];
    const locations = existingItems
      .map((item) => item.storageLocation)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locations)].sort();
  }, [existingItems]);

  const currentSubcategories = useMemo(() => {
    if (!category) return [];
    return SUBCATEGORIES[category] ?? [];
  }, [category]);

  const isSellable = availabilityTypes.includes(AvailabilityType.Sellable);
  const isBorrowable = availabilityTypes.includes(AvailabilityType.Borrowable);

  const filteredTagSuggestions = useMemo(() => {
    if (!userTags || !tagInput.trim()) return [];
    const q = tagInput.toLowerCase();
    return userTags.filter(
      (t) =>
        t.toLowerCase().includes(q) &&
        !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()),
    );
  }, [userTags, tagInput, tags]);

  // ── Handlers ─────────────────────────────────────────────────
  const toggleGroupId = useCallback((id: GroupId) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);

  const toggleAvailability = useCallback((type: AvailabilityType) => {
    setAvailabilityTypes((prev) => {
      if (type === AvailabilityType.Private) {
        return prev.includes(type) ? [] : [AvailabilityType.Private];
      }
      const filtered = prev.filter((t) => t !== AvailabilityType.Private);
      return filtered.includes(type) ? filtered.filter((t) => t !== type) : [...filtered, type];
    });
  }, []);

  const handleCategoryChange = useCallback((cat: ItemCategory) => {
    setCategory(cat);
    setSubcategory('');
    if (cat === ItemCategory.Consumable) {
      setUsage('');
    } else {
      setRemainingPercentStr('');
    }
  }, []);

  const clearTagBlurCommitTimeout = useCallback(() => {
    if (tagBlurCommitTimeoutRef.current !== null) {
      clearTimeout(tagBlurCommitTimeoutRef.current);
      tagBlurCommitTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTagBlurCommitTimeout(), [clearTagBlurCommitTimeout]);

  const handleAddTag = useCallback(
    (rawInput: string) => {
      clearTagBlurCommitTimeout();
      const tag = sanitizeTag(rawInput);
      if (canAddTag(tag, tags)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput('');
      setTagSuggestionsVisible(false);
    },
    [tags, clearTagBlurCommitTimeout],
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    clearTagBlurCommitTimeout();
    const pendingTag = sanitizeTag(tagInput);
    const tagsToSubmit = canAddTag(pendingTag, tags) ? [...tags, pendingTag] : tags;
    setTags(tagsToSubmit);
    setTagInput('');
    setTagSuggestionsVisible(false);

    const parsedRemaining =
      category === ItemCategory.Consumable
        ? parseRemainingPercentInput(remainingPercentStr)
        : undefined;

    const parsedQuantity = parseInt(quantityStr.trim(), 10);

    const formData: ItemFormData = {
      name,
      quantity: Number.isNaN(parsedQuantity) ? undefined : parsedQuantity,
      category,
      subcategory: subcategory || undefined,
      condition: category === ItemCategory.Consumable ? ItemCondition.Good : condition,
      brand: brand || undefined,
      model: model || undefined,
      description: description || undefined,
      availabilityTypes,
      price: isSellable && price ? parseFloat(price) : undefined,
      deposit: isBorrowable && deposit ? parseFloat(deposit) : undefined,
      borrowDuration: isBorrowable && borrowDuration ? borrowDuration : undefined,
      storageLocation: storageLocation || undefined,
      age: age || undefined,
      usage: usage ? parseInt(usage, 10) : undefined,
      usageUnit: usage ? distanceUnit : undefined,
      remainingFraction: parsedRemaining,
      visibility,
      groupIds: visibility === Visibility.Groups ? groupIds : undefined,
      tags: tagsToSubmit,
    };

    const validationErrors = validateItem(formData, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave(formData);
    }
  }, [
    name,
    quantityStr,
    category,
    subcategory,
    condition,
    brand,
    model,
    description,
    availabilityTypes,
    price,
    deposit,
    borrowDuration,
    storageLocation,
    age,
    usage,
    remainingPercentStr,
    distanceUnit,
    visibility,
    groupIds,
    tags,
    tagInput,
    clearTagBlurCommitTimeout,
    isSellable,
    isBorrowable,
    onSave,
    t,
  ]);

  return {
    name,
    setName,
    quantityStr,
    setQuantityStr,
    category,
    subcategory,
    setSubcategory,
    condition,
    setCondition,
    brand,
    brandMenuVisible,
    handleBrandFocus,
    handleBrandBlur,
    filteredBrands,
    model,
    setModel,
    handleBrandSelect,
    handleBrandInputChange,
    availabilityTypes,
    toggleAvailability,
    isSellable,
    isBorrowable,
    price,
    setPrice,
    deposit,
    setDeposit,
    borrowDuration,
    setBorrowDuration,
    durationMenuVisible,
    setDurationMenuVisible,
    visibility,
    setVisibility,
    groupIds,
    toggleGroupId,
    handleCategoryChange,
    currentSubcategories,
    remainingPercentStr,
    setRemainingPercentStr,
    age,
    setAge,
    ageMenuVisible,
    setAgeMenuVisible,
    usage,
    setUsage,
    distanceUnit,
    storageLocation,
    setStorageLocation,
    storageMenuVisible,
    setStorageMenuVisible,
    existingStorageLocations,
    description,
    setDescription,
    tags,
    tagInput,
    setTagInput,
    tagSuggestionsVisible,
    setTagSuggestionsVisible,
    filteredTagSuggestions,
    handleAddTag,
    handleRemoveTag,
    clearTagBlurCommitTimeout,
    tagBlurCommitTimeoutRef,
    showOptional,
    setShowOptional,
    errors,
    handleSubmit,
  };
}

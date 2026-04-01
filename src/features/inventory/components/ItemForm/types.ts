import type { MutableRefObject } from 'react';
import type { ItemCategory, ItemCondition, AvailabilityType, GroupId } from '@/shared/types';
import { Visibility } from '@/shared/types';
import type { ItemFormErrors } from '../../utils/validation';
import type { ItemFormData } from '../../utils/validation';

export type { ItemFormData, ItemFormErrors };

export interface ItemFormProps {
  initialData?: ItemFormData;
  initialCategory?: ItemCategory;
  onSave: (data: ItemFormData) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
  headerComponent?: React.ReactNode;
  photoSection?: React.ReactNode;
}

export interface InputStyling {
  softInputStyle: { backgroundColor: string; borderRadius: number };
  underlineColor: string;
  activeUnderlineColor: string;
}

export interface ItemFormState {
  // Basic fields
  name: string;
  setName: (v: string) => void;
  quantityStr: string;
  setQuantityStr: (v: string) => void;
  category: ItemCategory | undefined;
  subcategory: string;
  setSubcategory: (v: string) => void;
  condition: ItemCondition | undefined;
  setCondition: (v: ItemCondition) => void;

  // Brand / model
  brand: string;
  brandMenuVisible: boolean;
  handleBrandFocus: () => void;
  handleBrandBlur: () => void;
  filteredBrands: string[];
  model: string;
  setModel: (v: string) => void;
  handleBrandSelect: (brand: string) => void;
  handleBrandInputChange: (text: string) => void;

  // Availability
  availabilityTypes: AvailabilityType[];
  toggleAvailability: (type: AvailabilityType) => void;
  isSellable: boolean;
  isBorrowable: boolean;
  price: string;
  setPrice: (v: string) => void;
  deposit: string;
  setDeposit: (v: string) => void;
  borrowDuration: string;
  setBorrowDuration: (v: string) => void;
  durationMenuVisible: boolean;
  setDurationMenuVisible: (v: boolean) => void;

  // Visibility
  visibility: Visibility;
  setVisibility: (v: Visibility) => void;
  groupIds: GroupId[];
  toggleGroupId: (id: GroupId) => void;

  // Category-specific
  handleCategoryChange: (cat: ItemCategory) => void;
  currentSubcategories: readonly string[];
  remainingPercentStr: string;
  setRemainingPercentStr: (v: string) => void;

  // Condition
  // (setCondition already listed above)

  // Optional fields
  age: string;
  setAge: (v: string) => void;
  ageMenuVisible: boolean;
  setAgeMenuVisible: (v: boolean) => void;
  usageKm: string;
  setUsageKm: (v: string) => void;
  distanceUnit: string;
  storageLocation: string;
  setStorageLocation: (v: string) => void;
  storageMenuVisible: boolean;
  setStorageMenuVisible: (v: boolean) => void;
  existingStorageLocations: string[];
  description: string;
  setDescription: (v: string) => void;

  // Tags
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  tagSuggestionsVisible: boolean;
  setTagSuggestionsVisible: (v: boolean) => void;
  filteredTagSuggestions: string[];
  handleAddTag: (raw: string) => void;
  handleRemoveTag: (tag: string) => void;
  clearTagBlurCommitTimeout: () => void;
  tagBlurCommitTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;

  // Optional toggle
  showOptional: boolean;
  setShowOptional: (v: boolean) => void;

  // Errors & submit
  errors: ItemFormErrors;
  handleSubmit: () => void;
}

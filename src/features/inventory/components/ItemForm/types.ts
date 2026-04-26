import type { MutableRefObject } from 'react';
import {
  Visibility,
  type AvailabilityType,
  type GroupId,
  type ItemCategory,
  type ItemCondition,
} from '@/shared/types';
import type { ItemFormData, ItemFormErrors } from '../../utils/validation';

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
  /** When set, shows a banner and disables save (e.g. subscription inventory cap). */
  submitBlockedMessage?: string;
  /** Notified when dirty state changes (e.g. parent combines with photo edits for exit guard). */
  onDirtyChange?: (dirty: boolean) => void;
  /** Called when client-side validation fails (e.g. show a snackbar listing issues off-screen). */
  onValidationError?: (messages: string[]) => void;
}

export interface InputStyling {
  softInputStyle: { backgroundColor: string; borderRadius: number };
  underlineColor: string;
  activeUnderlineColor: string;
}

export interface ItemFormState {
  // Basic fields
  /** User-entered title; when blank, the name field shows brand + model (see `nameFieldValue`). */
  name: string;
  /** Value for the name TextInput: explicit `name`, or combined brand/model when `name` is blank. */
  nameFieldValue: string;
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
  cancelBrandBlurTimeout: () => void;
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
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  mountedDate: string;
  setMountedDate: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  ageMenuVisible: boolean;
  setAgeMenuVisible: (v: boolean) => void;
  usage: string;
  setUsage: (v: string) => void;
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
  /** False only when editing and the form matches `initialData` (no unsaved field changes). */
  isDirty: boolean;
}

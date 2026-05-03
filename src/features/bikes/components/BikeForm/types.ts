import type { ReactNode } from 'react';
import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../../types';
import type { BikeFormErrors } from '../../utils/bikeFormValidation';

export type { BikeFormErrors } from '../../utils/bikeFormValidation';

export interface BikeFormProps {
  readonly initialData?: BikeFormData;
  readonly headerComponent?: ReactNode;
  readonly photoSection?: ReactNode;
  readonly onSave: (data: BikeFormData) => void;
  readonly onDelete?: () => void;
  readonly isSubmitting: boolean;
  readonly isEditMode?: boolean;
  readonly submitBlockedMessage?: string;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly onValidationError?: (messages: string[]) => void;
}

export interface InputStyling {
  softInputStyle: { backgroundColor: string; borderRadius: number };
  underlineColor: string;
  activeUnderlineColor: string;
}

export interface BikeFormState {
  // Basic
  name: string;
  /** Value for the name TextInput: explicit `name`, or combined brand/model when `name` is blank. */
  nameFieldValue: string;
  setName: (v: string) => void;

  // Brand autocomplete
  brand: string;
  brandMenuVisible: boolean;
  filteredBrands: string[];
  handleBrandSelect: (brand: string) => void;
  handleBrandInputChange: (text: string) => void;
  handleBrandFocus: () => void;
  handleBrandBlur: () => void;
  cancelBrandBlurTimeout: () => void;

  // Model
  model: string;
  setModel: (v: string) => void;

  // Type / condition
  bikeType: BikeType | undefined;
  setBikeType: (v: BikeType) => void;
  condition: ItemCondition;
  setCondition: (v: ItemCondition) => void;

  // Metrics
  year: string;
  setYear: (v: string) => void;
  distanceKmStr: string;
  setDistanceKmStr: (v: string) => void;
  usageHoursStr: string;
  setUsageHoursStr: (v: string) => void;

  // Notes
  notes: string;
  setNotes: (v: string) => void;

  // Errors & submit
  errors: BikeFormErrors;
  handleSubmit: () => void;
  /** False only when editing and the form matches `initialData` (no unsaved field changes). */
  isDirty: boolean;
}

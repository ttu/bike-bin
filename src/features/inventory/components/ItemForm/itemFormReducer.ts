import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  Visibility,
  type GroupId,
  type DistanceUnit,
} from '@/shared/types';
import { kmToDisplayUnit } from '@/shared/utils/distanceConversion';
import { canAddTag, sanitizeTag } from '../../utils/tagUtils';
import { formatRemainingPercentField } from '../../utils/remainingFractionInput';
import type { ItemFormData, ItemFormErrors } from '../../utils/validation';

export interface ItemFormReducerState {
  basic: {
    name: string;
    quantityStr: string;
    category: ItemCategory | undefined;
    subcategory: string;
    condition: ItemCondition | undefined;
    brand: string;
    model: string;
  };
  availability: {
    types: AvailabilityType[];
    price: string;
    deposit: string;
    borrowDuration: string;
    durationMenuVisible: boolean;
  };
  visibility: {
    visibility: Visibility;
    groupIds: GroupId[];
  };
  optional: {
    showOptional: boolean;
    purchaseDate: string;
    mountedDate: string;
    age: string;
    ageMenuVisible: boolean;
    usage: string;
    storageLocation: string;
    storageMenuVisible: boolean;
    description: string;
    remainingPercentStr: string;
  };
  tags: {
    list: string[];
    input: string;
    suggestionsVisible: boolean;
  };
  errors: ItemFormErrors;
}

export type ItemFormAction =
  | { type: 'setName'; value: string }
  | { type: 'setQuantityStr'; value: string }
  | { type: 'changeCategory'; value: ItemCategory }
  | { type: 'setSubcategory'; value: string }
  | { type: 'setCondition'; value: ItemCondition }
  | { type: 'setBrand'; value: string }
  | { type: 'setModel'; value: string }
  | { type: 'toggleAvailability'; value: AvailabilityType }
  | { type: 'setPrice'; value: string }
  | { type: 'setDeposit'; value: string }
  | { type: 'setBorrowDuration'; value: string }
  | { type: 'setDurationMenuVisible'; value: boolean }
  | { type: 'setVisibility'; value: Visibility }
  | { type: 'toggleGroup'; value: GroupId }
  | { type: 'setShowOptional'; value: boolean }
  | { type: 'setPurchaseDate'; value: string }
  | { type: 'setMountedDate'; value: string }
  | { type: 'setAge'; value: string }
  | { type: 'setAgeMenuVisible'; value: boolean }
  | { type: 'setUsage'; value: string }
  | { type: 'setStorageLocation'; value: string }
  | { type: 'setStorageMenuVisible'; value: boolean }
  | { type: 'setDescription'; value: string }
  | { type: 'setRemainingPercentStr'; value: string }
  | { type: 'setTagInput'; value: string }
  | { type: 'setTagSuggestionsVisible'; value: boolean }
  | { type: 'addTag'; value: string }
  | { type: 'removeTag'; value: string }
  | { type: 'commitPendingTagAndSubmit' }
  | { type: 'setErrors'; value: ItemFormErrors };

const sliceDate = (raw: string | undefined): string => {
  if (!raw) return '';
  return raw.length >= 10 ? raw.slice(0, 10) : raw;
};

export interface MakeInitialStateParams {
  initialData?: ItemFormData;
  initialCategory?: ItemCategory;
  distanceUnit: DistanceUnit;
}

export function makeInitialItemFormState({
  initialData,
  initialCategory,
  distanceUnit,
}: MakeInitialStateParams): ItemFormReducerState {
  const usageInitial =
    initialData?.usageKm === undefined
      ? ''
      : kmToDisplayUnit(initialData.usageKm, distanceUnit).toString();

  return {
    basic: {
      name: initialData?.name ?? '',
      quantityStr: String(initialData?.quantity ?? 1),
      category: initialData?.category ?? initialCategory,
      subcategory: initialData?.subcategory ?? '',
      condition: initialData?.condition ?? ItemCondition.New,
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
    },
    availability: {
      types: initialData?.availabilityTypes ?? [AvailabilityType.Private],
      price: initialData?.price?.toString() ?? '',
      deposit: initialData?.deposit?.toString() ?? '',
      borrowDuration: initialData?.borrowDuration ?? '',
      durationMenuVisible: false,
    },
    visibility: {
      visibility: initialData?.visibility ?? Visibility.Private,
      groupIds: initialData?.groupIds ?? [],
    },
    optional: {
      showOptional: false,
      purchaseDate: sliceDate(initialData?.purchaseDate),
      mountedDate: sliceDate(initialData?.mountedDate),
      age: initialData?.age ?? '',
      ageMenuVisible: false,
      usage: usageInitial,
      storageLocation: initialData?.storageLocation ?? '',
      storageMenuVisible: false,
      description: initialData?.description ?? '',
      remainingPercentStr: formatRemainingPercentField(initialData?.remainingFraction),
    },
    tags: {
      list: initialData?.tags ?? [],
      input: '',
      suggestionsVisible: false,
    },
    errors: {},
  };
}

export function itemFormReducer(
  state: ItemFormReducerState,
  action: ItemFormAction,
): ItemFormReducerState {
  switch (action.type) {
    case 'setName':
      return { ...state, basic: { ...state.basic, name: action.value } };
    case 'setQuantityStr':
      return { ...state, basic: { ...state.basic, quantityStr: action.value } };
    case 'changeCategory': {
      const next = action.value;
      const isConsumable = next === ItemCategory.Consumable;
      return {
        ...state,
        basic: { ...state.basic, category: next, subcategory: '' },
        optional: {
          ...state.optional,
          usage: isConsumable ? '' : state.optional.usage,
          remainingPercentStr: isConsumable ? state.optional.remainingPercentStr : '',
        },
      };
    }
    case 'setSubcategory':
      return { ...state, basic: { ...state.basic, subcategory: action.value } };
    case 'setCondition':
      return { ...state, basic: { ...state.basic, condition: action.value } };
    case 'setBrand':
      return { ...state, basic: { ...state.basic, brand: action.value } };
    case 'setModel':
      return { ...state, basic: { ...state.basic, model: action.value } };
    case 'toggleAvailability': {
      const prev = state.availability.types;
      let nextTypes: AvailabilityType[];
      if (action.value === AvailabilityType.Private) {
        nextTypes = prev.includes(AvailabilityType.Private) ? [] : [AvailabilityType.Private];
      } else {
        const filtered = prev.filter((t) => t !== AvailabilityType.Private);
        nextTypes = filtered.includes(action.value)
          ? filtered.filter((t) => t !== action.value)
          : [...filtered, action.value];
      }
      return { ...state, availability: { ...state.availability, types: nextTypes } };
    }
    case 'setPrice':
      return { ...state, availability: { ...state.availability, price: action.value } };
    case 'setDeposit':
      return { ...state, availability: { ...state.availability, deposit: action.value } };
    case 'setBorrowDuration':
      return { ...state, availability: { ...state.availability, borrowDuration: action.value } };
    case 'setDurationMenuVisible':
      return {
        ...state,
        availability: { ...state.availability, durationMenuVisible: action.value },
      };
    case 'setVisibility':
      return { ...state, visibility: { ...state.visibility, visibility: action.value } };
    case 'toggleGroup': {
      const ids = state.visibility.groupIds;
      const nextIds = ids.includes(action.value)
        ? ids.filter((g) => g !== action.value)
        : [...ids, action.value];
      return { ...state, visibility: { ...state.visibility, groupIds: nextIds } };
    }
    case 'setShowOptional':
      return { ...state, optional: { ...state.optional, showOptional: action.value } };
    case 'setPurchaseDate':
      return { ...state, optional: { ...state.optional, purchaseDate: action.value } };
    case 'setMountedDate':
      return { ...state, optional: { ...state.optional, mountedDate: action.value } };
    case 'setAge':
      return { ...state, optional: { ...state.optional, age: action.value } };
    case 'setAgeMenuVisible':
      return { ...state, optional: { ...state.optional, ageMenuVisible: action.value } };
    case 'setUsage':
      return { ...state, optional: { ...state.optional, usage: action.value } };
    case 'setStorageLocation':
      return { ...state, optional: { ...state.optional, storageLocation: action.value } };
    case 'setStorageMenuVisible':
      return { ...state, optional: { ...state.optional, storageMenuVisible: action.value } };
    case 'setDescription':
      return { ...state, optional: { ...state.optional, description: action.value } };
    case 'setRemainingPercentStr':
      return { ...state, optional: { ...state.optional, remainingPercentStr: action.value } };
    case 'setTagInput':
      return { ...state, tags: { ...state.tags, input: action.value } };
    case 'setTagSuggestionsVisible':
      return { ...state, tags: { ...state.tags, suggestionsVisible: action.value } };
    case 'addTag': {
      const tag = sanitizeTag(action.value);
      const list = canAddTag(tag, state.tags.list) ? [...state.tags.list, tag] : state.tags.list;
      return { ...state, tags: { list, input: '', suggestionsVisible: false } };
    }
    case 'removeTag':
      return {
        ...state,
        tags: { ...state.tags, list: state.tags.list.filter((t) => t !== action.value) },
      };
    case 'commitPendingTagAndSubmit': {
      const pending = sanitizeTag(state.tags.input);
      const list = canAddTag(pending, state.tags.list)
        ? [...state.tags.list, pending]
        : state.tags.list;
      return { ...state, tags: { list, input: '', suggestionsVisible: false } };
    }
    case 'setErrors':
      return { ...state, errors: action.value };
  }
}

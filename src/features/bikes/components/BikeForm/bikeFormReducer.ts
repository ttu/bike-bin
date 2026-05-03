import { BikeType, ItemCondition } from '@/shared/types';
import type { BikeFormData } from '../../types';
import type { BikeFormErrors } from '../../utils/bikeFormValidation';

export interface BikeFormFields {
  name: string;
  brand: string;
  model: string;
  type: BikeType | undefined;
  year: string;
  distanceKmStr: string;
  usageHoursStr: string;
  condition: ItemCondition;
  notes: string;
}

export interface BikeFormReducerState {
  fields: BikeFormFields;
  errors: BikeFormErrors;
}

export type BikeFormAction =
  | { type: 'setName'; value: string }
  | { type: 'setBrand'; value: string }
  | { type: 'setModel'; value: string }
  | { type: 'setBikeType'; value: BikeType }
  | { type: 'setYear'; value: string }
  | { type: 'setDistanceKmStr'; value: string }
  | { type: 'setUsageHoursStr'; value: string }
  | { type: 'setCondition'; value: ItemCondition }
  | { type: 'setNotes'; value: string }
  | { type: 'setErrors'; value: BikeFormErrors };

export function makeInitialBikeFormState(initialData?: BikeFormData): BikeFormReducerState {
  return {
    fields: {
      name: initialData?.name ?? '',
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
      type: initialData?.type,
      year: initialData?.year?.toString() ?? '',
      distanceKmStr: initialData?.distanceKm == null ? '' : String(initialData.distanceKm),
      usageHoursStr: initialData?.usageHours == null ? '' : String(initialData.usageHours),
      condition: initialData?.condition ?? ItemCondition.New,
      notes: initialData?.notes ?? '',
    },
    errors: {},
  };
}

export function bikeFormReducer(
  state: BikeFormReducerState,
  action: BikeFormAction,
): BikeFormReducerState {
  switch (action.type) {
    case 'setName':
      return { ...state, fields: { ...state.fields, name: action.value } };
    case 'setBrand':
      return { ...state, fields: { ...state.fields, brand: action.value } };
    case 'setModel':
      return { ...state, fields: { ...state.fields, model: action.value } };
    case 'setBikeType':
      return { ...state, fields: { ...state.fields, type: action.value } };
    case 'setYear':
      return { ...state, fields: { ...state.fields, year: action.value } };
    case 'setDistanceKmStr':
      return { ...state, fields: { ...state.fields, distanceKmStr: action.value } };
    case 'setUsageHoursStr':
      return { ...state, fields: { ...state.fields, usageHoursStr: action.value } };
    case 'setCondition':
      return { ...state, fields: { ...state.fields, condition: action.value } };
    case 'setNotes':
      return { ...state, fields: { ...state.fields, notes: action.value } };
    case 'setErrors':
      return { ...state, errors: action.value };
  }
}

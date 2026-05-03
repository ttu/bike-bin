import { useCallback, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { BikeType, ItemCondition } from '@/shared/types';
import { useBrandAutocomplete } from '@/shared/hooks/useBrandAutocomplete';
import { resolveFormName } from '@/shared/utils';
import { collectFormErrorMessages } from '@/shared/utils/formValidationFeedback';
import type { BikeFormData } from '../../types';
import { DEFAULT_BIKE_BRANDS } from '../../constants';
import { buildBikeFormDataFromFields } from '../../utils/buildBikeFormDataFromFields';
import { areBikeFormDataEqual } from '../../utils/bikeFormDataEquality';
import { validateBikeForm } from '../../utils/bikeFormValidation';
import {
  bikeFormReducer,
  makeInitialBikeFormState,
  type BikeFormReducerState,
} from './bikeFormReducer';
import type { BikeFormState } from './types';

interface UseBikeFormStateParams {
  initialData?: BikeFormData;
  onSave: (data: BikeFormData) => void;
  onValidationError?: (messages: string[]) => void;
}

export function useBikeFormState({
  initialData,
  onSave,
  onValidationError,
}: UseBikeFormStateParams): BikeFormState {
  const { t } = useTranslation('bikes');

  const [state, dispatch] = useReducer(bikeFormReducer, initialData, makeInitialBikeFormState);
  const { fields, errors } = state;

  const setName = useCallback((value: string) => dispatch({ type: 'setName', value }), []);
  const setBrand = useCallback((value: string) => dispatch({ type: 'setBrand', value }), []);
  const setModel = useCallback((value: string) => dispatch({ type: 'setModel', value }), []);
  const setBikeType = useCallback(
    (value: BikeType) => dispatch({ type: 'setBikeType', value }),
    [],
  );
  const setYear = useCallback((value: string) => dispatch({ type: 'setYear', value }), []);
  const setDistanceKmStr = useCallback(
    (value: string) => dispatch({ type: 'setDistanceKmStr', value }),
    [],
  );
  const setUsageHoursStr = useCallback(
    (value: string) => dispatch({ type: 'setUsageHoursStr', value }),
    [],
  );
  const setCondition = useCallback(
    (value: ItemCondition) => dispatch({ type: 'setCondition', value }),
    [],
  );
  const setNotes = useCallback((value: string) => dispatch({ type: 'setNotes', value }), []);

  const {
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
    cancelBlurTimeout: cancelBrandBlurTimeout,
  } = useBrandAutocomplete({
    brand: fields.brand,
    setBrand,
    brands: DEFAULT_BIKE_BRANDS,
  });

  const nameFieldValue = useMemo(
    () =>
      fields.name.trim() === '' ? resolveFormName('', fields.brand, fields.model) : fields.name,
    [fields.name, fields.brand, fields.model],
  );

  const draftFormData: BikeFormData = useMemo(() => buildDraft(state), [state]);

  const isDirty = useMemo(() => {
    if (!initialData) return true;
    return !areBikeFormDataEqual(initialData, draftFormData);
  }, [initialData, draftFormData]);

  const handleSubmit = useCallback(() => {
    const validationErrors = validateBikeForm(
      {
        name: fields.name,
        brand: fields.brand,
        model: fields.model,
        bikeType: fields.type,
        distanceKmStr: fields.distanceKmStr,
        usageHoursStr: fields.usageHoursStr,
      },
      t,
    );
    dispatch({ type: 'setErrors', value: validationErrors });

    if (Object.keys(validationErrors).length > 0) {
      const messages = collectFormErrorMessages(validationErrors);
      if (messages.length > 0) {
        onValidationError?.(messages);
      }
      return;
    }

    onSave(draftFormData);
  }, [
    fields.name,
    fields.brand,
    fields.model,
    fields.type,
    fields.distanceKmStr,
    fields.usageHoursStr,
    t,
    onSave,
    onValidationError,
    draftFormData,
  ]);

  return {
    name: fields.name,
    nameFieldValue,
    setName,
    brand: fields.brand,
    brandMenuVisible,
    filteredBrands,
    handleBrandSelect,
    handleBrandInputChange,
    handleBrandFocus,
    handleBrandBlur,
    cancelBrandBlurTimeout,
    model: fields.model,
    setModel,
    bikeType: fields.type,
    setBikeType,
    condition: fields.condition,
    setCondition,
    year: fields.year,
    setYear,
    distanceKmStr: fields.distanceKmStr,
    setDistanceKmStr,
    usageHoursStr: fields.usageHoursStr,
    setUsageHoursStr,
    notes: fields.notes,
    setNotes,
    errors,
    handleSubmit,
    isDirty,
  };
}

function buildDraft(state: BikeFormReducerState): BikeFormData {
  return buildBikeFormDataFromFields({
    name: state.fields.name,
    brand: state.fields.brand,
    model: state.fields.model,
    bikeType: state.fields.type,
    year: state.fields.year,
    distanceKmStr: state.fields.distanceKmStr,
    usageHoursStr: state.fields.usageHoursStr,
    bikeCondition: state.fields.condition,
    notes: state.fields.notes,
  });
}

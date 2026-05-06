import { useTranslation } from 'react-i18next';
import { ConditionPicker } from '@/shared/components';
import { ItemCondition } from '@/shared/types';
import type { BikeFormState } from '../types';

interface ConditionSectionProps {
  readonly state: BikeFormState;
}

export function ConditionSection({ state }: ConditionSectionProps) {
  const { t } = useTranslation('bikes');

  return (
    <ConditionPicker
      condition={state.condition}
      onConditionChange={state.setCondition}
      headerLabel={t('form.conditionLabel')}
      conditionLabel={(c: ItemCondition) => t(`condition.${c}`)}
    />
  );
}

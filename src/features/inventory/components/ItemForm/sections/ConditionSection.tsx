import { useTranslation } from 'react-i18next';
import { ConditionPicker } from '@/shared/components';
import { ItemCondition } from '@/shared/types';
import type { ItemFormState } from '../types';

interface ConditionSectionProps {
  readonly state: ItemFormState;
}

export function ConditionSection({ state }: ConditionSectionProps) {
  const { t } = useTranslation('inventory');
  const { condition, setCondition, errors } = state;

  return (
    <ConditionPicker
      condition={condition}
      onConditionChange={setCondition}
      headerLabel={t('form.conditionLabel')}
      conditionLabel={(c: ItemCondition) => t(`condition.${c}`)}
      error={errors.condition}
    />
  );
}

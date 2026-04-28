import { useTranslation } from 'react-i18next';
import { GroupForm, type GroupFormSubmission } from '../GroupForm/GroupForm';

type GroupCreateFormProps = {
  readonly onBack: () => void;
  readonly onSubmit: (data: GroupFormSubmission) => void;
  readonly isSubmitting: boolean;
};

export function GroupCreateForm({ onBack, onSubmit, isSubmitting }: GroupCreateFormProps) {
  const { t } = useTranslation('groups');
  return (
    <GroupForm
      title={t('create.title')}
      submitLabel={t('create.save')}
      submitTestID="groups-create-save"
      isSubmitting={isSubmitting}
      onCancel={onBack}
      onSubmit={onSubmit}
    />
  );
}

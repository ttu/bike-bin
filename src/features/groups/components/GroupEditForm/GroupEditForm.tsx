import { useTranslation } from 'react-i18next';
import { GroupForm, type GroupFormSubmission } from '../GroupForm/GroupForm';

type GroupEditFormProps = {
  readonly initialName: string;
  readonly initialDescription: string;
  readonly initialIsPublic: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (data: GroupFormSubmission) => void;
  readonly isSubmitting: boolean;
};

export function GroupEditForm({
  initialName,
  initialDescription,
  initialIsPublic,
  onCancel,
  onSubmit,
  isSubmitting,
}: GroupEditFormProps) {
  const { t } = useTranslation('groups');
  return (
    <GroupForm
      title={t('edit.title')}
      submitLabel={t('edit.save')}
      initialName={initialName}
      initialDescription={initialDescription}
      initialIsPublic={initialIsPublic}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
}

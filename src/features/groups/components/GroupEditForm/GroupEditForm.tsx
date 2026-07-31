import { useTranslation } from 'react-i18next';
import { GroupForm, type GroupFormSubmission } from '../GroupForm/GroupForm';

type GroupEditFormProps = {
  readonly initialName: string;
  readonly initialDescription: string;
  readonly initialIsPublic: boolean;
  readonly initialPostcode?: string;
  readonly initialCountry?: string;
  readonly initialAreaName?: string;
  readonly initialLatitude?: number;
  readonly initialLongitude?: number;
  readonly onCancel: () => void;
  readonly onSubmit: (data: GroupFormSubmission) => void;
  readonly isSubmitting: boolean;
};

export function GroupEditForm({
  initialName,
  initialDescription,
  initialIsPublic,
  initialPostcode,
  initialCountry,
  initialAreaName,
  initialLatitude,
  initialLongitude,
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
      initialPostcode={initialPostcode}
      initialCountry={initialCountry}
      initialAreaName={initialAreaName}
      initialLatitude={initialLatitude}
      initialLongitude={initialLongitude}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
}

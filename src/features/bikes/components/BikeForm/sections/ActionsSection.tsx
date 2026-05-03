import { Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/GradientButton';
import type { AppTheme } from '@/shared/theme';
import type { BikeFormState } from '../types';
import { styles } from '../styles';

interface ActionsSectionProps {
  readonly state: BikeFormState;
  readonly isSubmitting: boolean;
  readonly isEditMode: boolean;
  readonly onDelete?: () => void;
  readonly saveDisabled?: boolean;
}

export function ActionsSection({
  state,
  isSubmitting,
  isEditMode,
  onDelete,
  saveDisabled = false,
}: ActionsSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

  return (
    <>
      <GradientButton
        onPress={state.handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting || saveDisabled}
        icon={isEditMode ? 'check-circle-outline' : undefined}
        style={styles.saveButton}
      >
        {isEditMode ? t('form.updateBike') : t('form.save')}
      </GradientButton>

      {onDelete && (
        <Button
          mode="text"
          onPress={onDelete}
          textColor={theme.colors.error}
          style={styles.deleteButton}
        >
          {t('form.delete')}
        </Button>
      )}
    </>
  );
}

import { Button, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import type { ItemFormState } from '../types';
import { styles } from '../styles';

interface ActionsSectionProps {
  handleSubmit: ItemFormState['handleSubmit'];
  isSubmitting: boolean;
  isEditMode: boolean;
  onDelete?: () => void;
}

export function ActionsSection({
  handleSubmit,
  isSubmitting,
  isEditMode,
  onDelete,
}: ActionsSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  return (
    <>
      <GradientButton
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        icon={isEditMode ? 'check-circle-outline' : undefined}
        style={styles.saveButton}
      >
        {isEditMode ? t('form.updateInventory') : t('form.save')}
      </GradientButton>

      {onDelete && (
        <Button
          mode="text"
          onPress={onDelete}
          textColor={theme.colors.error}
          style={styles.deleteButton}
        >
          {t('removeFromInventory')}
        </Button>
      )}
    </>
  );
}

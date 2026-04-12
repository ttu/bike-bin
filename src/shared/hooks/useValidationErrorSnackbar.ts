import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { formatValidationFeedbackBody } from '@/shared/utils/formValidationFeedback';

/**
 * Stable callback for form validation: composes intro + optional bullet-prefixed
 * lines and shows an error snackbar. Uses `common.formValidation.*` strings.
 */
export function useValidationErrorSnackbar() {
  const { showSnackbarAlert } = useSnackbarAlerts();
  const { t } = useTranslation('common');

  return useCallback(
    (messages: string[]) => {
      const body = formatValidationFeedbackBody(
        t('formValidation.summaryIntro'),
        messages,
        t('formValidation.bulletPrefix'),
      );
      if (!body) return;
      showSnackbarAlert({
        message: body,
        variant: 'error',
        duration: 'long',
      });
    },
    [showSnackbarAlert, t],
  );
}

import { useTranslation } from 'react-i18next';

export interface ReportFeedbackMessages {
  success: string;
  error: string;
}

/**
 * Translated success/error snackbar messages for the report flow. The keys
 * live under the `profile` namespace (alongside the report dialog copy);
 * this hook hides that detail from callers.
 */
export function useReportFeedbackMessages(): ReportFeedbackMessages {
  const { t } = useTranslation('profile');
  return {
    success: t('report.successMessage'),
    error: t('report.errorMessage'),
  };
}

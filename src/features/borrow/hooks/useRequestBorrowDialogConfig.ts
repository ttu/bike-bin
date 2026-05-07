import { useTranslation } from 'react-i18next';

export interface RequestBorrowDialogConfig {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  errorMessage: string;
}

/**
 * Returns the confirm-dialog labels and the error-snackbar message for the
 * "request to borrow" flow. Owns the `borrow` i18n namespace so callers
 * outside this feature don't need to import it.
 */
export function useRequestBorrowDialogConfig(itemName: string): RequestBorrowDialogConfig {
  const { t } = useTranslation('borrow');
  return {
    title: t('confirm.requestBorrow.title'),
    message: t('confirm.requestBorrow.message', { itemName }),
    cancelLabel: t('confirm.requestBorrow.cancel'),
    confirmLabel: t('confirm.requestBorrow.confirm'),
    errorMessage: t('error.requestFailed'),
  };
}

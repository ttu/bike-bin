import { useTranslation } from 'react-i18next';

export interface MarkReturnedDialogConfig {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
}

/**
 * Returns the confirm-dialog labels for marking a borrow as returned. Owns the
 * `borrow` i18n namespace so callers outside this feature don't need to import it.
 */
export function useMarkReturnedDialogConfig(): MarkReturnedDialogConfig {
  const { t } = useTranslation('borrow');
  return {
    title: t('confirm.markReturned.title'),
    message: t('confirm.markReturned.message'),
    cancelLabel: t('confirm.markReturned.cancel'),
    confirmLabel: t('confirm.markReturned.confirm'),
  };
}
